-- ============================================================
-- 🏝️  RESORT MANAGEMENT — DATABASE SCHEMA + RLS
-- รันไฟล์นี้ใน Supabase SQL Editor (ใหม่ → run ทีเดียว)
-- ============================================================

-- ----- EXTENSIONS -----
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'receptionist', 'housekeeping');
create type room_status as enum ('available', 'occupied', 'cleaning', 'maintenance', 'out_of_service');
create type booking_status as enum ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
create type payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');
create type payment_method as enum ('cash', 'transfer', 'credit_card', 'qr_code', 'other');
create type guest_type as enum ('regular', 'vip', 'corporate');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'receptionist',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);

-- Auto-create profile when new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'receptionist')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROOM TYPES
-- ============================================================
create table public.room_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,                 -- e.g. "Deluxe Villa"
  slug text not null unique,                 -- e.g. "deluxe-villa"
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  max_occupancy int not null default 2 check (max_occupancy > 0),
  bed_type text,                             -- "King", "Twin"...
  size_sqm numeric(6,2),
  amenities jsonb not null default '[]'::jsonb,
  cover_image_url text,
  images jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROOMS
-- ============================================================
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  room_number text not null unique,          -- "101", "Villa-3"
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  floor text,
  status room_status not null default 'available',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rooms_status on public.rooms(status);
create index idx_rooms_type on public.rooms(room_type_id);

-- ============================================================
-- GUESTS (CRM)
-- ============================================================
create table public.guests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  id_card_number text,                       -- เลขบัตรประชาชน/พาสปอร์ต
  nationality text default 'TH',
  date_of_birth date,
  address text,
  guest_type guest_type not null default 'regular',
  vip_notes text,
  special_requests text,
  total_stays int not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_stay_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guests_name on public.guests using gin (to_tsvector('simple', full_name));
create index idx_guests_phone on public.guests(phone);
create index idx_guests_email on public.guests(email);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_code text unique not null default ('BK' || to_char(now(), 'YYMMDD') || lpad((floor(random()*10000))::text, 4, '0')),
  guest_id uuid not null references public.guests(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  check_in_date date not null,
  check_out_date date not null,
  actual_check_in_at timestamptz,
  actual_check_out_at timestamptz,
  num_adults int not null default 1 check (num_adults > 0),
  num_children int not null default 0 check (num_children >= 0),
  status booking_status not null default 'pending',
  total_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  notes text,
  source text default 'walk_in',             -- walk_in, phone, website, agoda, booking.com...
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_dates check (check_out_date > check_in_date)
);

create index idx_bookings_dates on public.bookings(check_in_date, check_out_date);
create index idx_bookings_room on public.bookings(room_id);
create index idx_bookings_guest on public.bookings(guest_id);
create index idx_bookings_status on public.bookings(status);

-- ป้องกันจองซ้อน (overlap) สำหรับ booking ที่ active
create or replace function public.check_booking_overlap()
returns trigger language plpgsql as $$
begin
  if new.status in ('cancelled', 'no_show') then
    return new;
  end if;

  if exists (
    select 1 from public.bookings
    where room_id = new.room_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and status not in ('cancelled', 'no_show', 'checked_out')
      and (check_in_date, check_out_date) overlaps (new.check_in_date, new.check_out_date)
  ) then
    raise exception 'Room is already booked for the selected date range';
  end if;

  return new;
end;
$$;

create trigger trg_booking_overlap
  before insert or update on public.bookings
  for each row execute function public.check_booking_overlap();

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null default ('INV' || to_char(now(), 'YYMMDD') || lpad((floor(random()*10000))::text, 4, '0')),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_status payment_status not null default 'unpaid',
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_booking on public.invoices(booking_id);
create index idx_invoices_status on public.invoices(payment_status);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
create table public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS (รวมทั้ง slip โอน)
-- ============================================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null,
  reference_number text,
  slip_url text,                             -- path ใน Supabase Storage
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_payments_invoice on public.payments(invoice_id);

-- Auto-update invoice paid_amount + payment_status
create or replace function public.update_invoice_payment_status()
returns trigger language plpgsql as $$
declare
  v_total numeric(12,2);
  v_paid  numeric(12,2);
  v_invoice_id uuid;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(amount), 0) into v_paid
  from public.payments where invoice_id = v_invoice_id;

  select total into v_total
  from public.invoices where id = v_invoice_id;

  update public.invoices
  set paid_amount = v_paid,
      payment_status = case
        when v_paid <= 0 then 'unpaid'::payment_status
        when v_paid < v_total then 'partial'::payment_status
        when v_paid >= v_total then 'paid'::payment_status
      end,
      updated_at = now()
  where id = v_invoice_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_payment_after
  after insert or update or delete on public.payments
  for each row execute function public.update_invoice_payment_status();

-- ============================================================
-- HOUSEKEEPING TASKS
-- ============================================================
create table public.housekeeping_tasks (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  task_type text not null default 'cleaning',  -- cleaning, maintenance, inspection
  priority text not null default 'normal',     -- low, normal, high, urgent
  status text not null default 'pending',      -- pending, in_progress, done, blocked
  assigned_to uuid references public.profiles(id),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_hk_status on public.housekeeping_tasks(status);
create index idx_hk_assigned on public.housekeeping_tasks(assigned_to);

-- ============================================================
-- ACTIVITY LOG (audit trail)
-- ============================================================
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,                        -- "booking.created", "payment.recorded"
  entity_type text not null,                   -- "booking", "payment"
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_logs_actor on public.activity_logs(actor_id);
create index idx_logs_entity on public.activity_logs(entity_type, entity_id);

-- ============================================================
-- updated_at trigger (reusable)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array['profiles','room_types','rooms','guests','bookings','invoices','housekeeping_tasks'])
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%s; create trigger trg_%s_updated before update on public.%s for each row execute function public.set_updated_at();', t, t, t, t);
  end loop;
end $$;

-- ============================================================
-- HELPER: get current user's role (for RLS policies)
-- ============================================================
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'receptionist'));
$$;

-- ============================================================
-- ROW LEVEL SECURITY — เปิดทุกตาราง
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.room_types          enable row level security;
alter table public.rooms               enable row level security;
alter table public.guests              enable row level security;
alter table public.bookings            enable row level security;
alter table public.invoices            enable row level security;
alter table public.invoice_items       enable row level security;
alter table public.payments            enable row level security;
alter table public.housekeeping_tasks  enable row level security;
alter table public.activity_logs       enable row level security;

-- ----- PROFILES -----
create policy "profile self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profile self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "admin manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ----- ROOM TYPES (อ่านได้ทุก authenticated, แก้ admin) -----
create policy "auth read room_types" on public.room_types
  for select using (auth.role() = 'authenticated');

create policy "admin write room_types" on public.room_types
  for all using (public.is_admin()) with check (public.is_admin());

-- ----- ROOMS -----
create policy "auth read rooms" on public.rooms
  for select using (auth.role() = 'authenticated');

create policy "staff update room status" on public.rooms
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin write rooms" on public.rooms
  for insert with check (public.is_admin());

create policy "admin delete rooms" on public.rooms
  for delete using (public.is_admin());

-- ----- GUESTS (staff = admin + receptionist) -----
create policy "staff read guests" on public.guests
  for select using (public.is_staff());

create policy "staff write guests" on public.guests
  for all using (public.is_staff()) with check (public.is_staff());

-- ----- BOOKINGS -----
create policy "staff read bookings" on public.bookings
  for select using (public.is_staff());

create policy "staff write bookings" on public.bookings
  for all using (public.is_staff()) with check (public.is_staff());

-- housekeeping เห็นเฉพาะข้อมูลห้องที่จะทำความสะอาด (read-only ผ่าน view ในอนาคต)
create policy "housekeeping read bookings" on public.bookings
  for select using (public.current_role() = 'housekeeping');

-- ----- INVOICES + ITEMS + PAYMENTS -----
create policy "staff read invoices" on public.invoices
  for select using (public.is_staff());
create policy "staff write invoices" on public.invoices
  for all using (public.is_staff()) with check (public.is_staff());

create policy "staff read invoice_items" on public.invoice_items
  for select using (public.is_staff());
create policy "staff write invoice_items" on public.invoice_items
  for all using (public.is_staff()) with check (public.is_staff());

create policy "staff read payments" on public.payments
  for select using (public.is_staff());
create policy "staff write payments" on public.payments
  for all using (public.is_staff()) with check (public.is_staff());

-- ----- HOUSEKEEPING TASKS -----
create policy "auth read hk tasks" on public.housekeeping_tasks
  for select using (auth.role() = 'authenticated');

create policy "staff write hk tasks" on public.housekeeping_tasks
  for all using (public.is_staff()) with check (public.is_staff());

create policy "hk update own tasks" on public.housekeeping_tasks
  for update using (public.current_role() = 'housekeeping' and assigned_to = auth.uid())
  with check (public.current_role() = 'housekeeping' and assigned_to = auth.uid());

-- ----- ACTIVITY LOGS -----
create policy "admin read logs" on public.activity_logs
  for select using (public.is_admin());

create policy "auth insert logs" on public.activity_logs
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('payment-slips', 'payment-slips', false),
  ('room-photos',    'room-photos',    true),
  ('avatars',        'avatars',        true)
on conflict (id) do nothing;

-- payment-slips: เฉพาะ staff อ่าน/เขียน
create policy "staff read slips" on storage.objects
  for select using (bucket_id = 'payment-slips' and public.is_staff());

create policy "staff upload slips" on storage.objects
  for insert with check (bucket_id = 'payment-slips' and public.is_staff());

create policy "staff delete slips" on storage.objects
  for delete using (bucket_id = 'payment-slips' and public.is_staff());

-- room-photos: public read, admin write
create policy "public read room photos" on storage.objects
  for select using (bucket_id = 'room-photos');

create policy "admin write room photos" on storage.objects
  for insert with check (bucket_id = 'room-photos' and public.is_admin());

create policy "admin delete room photos" on storage.objects
  for delete using (bucket_id = 'room-photos' and public.is_admin());

-- avatars: public read, owner write
create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "owner upload avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner update avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- VIEWS — ช่วย dashboard query เร็วขึ้น
-- ============================================================
create or replace view public.v_dashboard_stats as
select
  (select count(*) from bookings where check_in_date = current_date  and status in ('confirmed','checked_in')) as todays_checkins,
  (select count(*) from bookings where check_out_date = current_date and status in ('checked_in','checked_out')) as todays_checkouts,
  (select count(*) from rooms where status = 'occupied')                                                         as occupied_rooms,
  (select count(*) from rooms where is_active = true)                                                            as total_rooms,
  (select coalesce(sum(grand_total), 0) from bookings
     where created_at::date = current_date and status not in ('cancelled','no_show'))                            as todays_revenue,
  (select coalesce(sum(grand_total), 0) from bookings
     where date_trunc('month', created_at) = date_trunc('month', current_date)
       and status not in ('cancelled','no_show'))                                                                as month_revenue;

-- ============================================================
-- SEED DATA (ตัวอย่าง — ลบทิ้งภายหลังได้)
-- ============================================================
insert into public.room_types (name, slug, description, base_price, max_occupancy, bed_type, size_sqm, amenities) values
  ('Standard Room', 'standard', 'ห้องพักมาตรฐาน วิวสวน บรรยากาศสงบ', 1500, 2, 'Queen', 28,
   '["WiFi","แอร์","ทีวี","ตู้เย็น","อาบน้ำอุ่น"]'::jsonb),
  ('Deluxe Room',   'deluxe',   'ห้องดีลักซ์ วิวสระว่ายน้ำ พื้นที่กว้างขึ้น', 2500, 2, 'King', 38,
   '["WiFi","แอร์","ทีวี","มินิบาร์","อาบน้ำอุ่น","ระเบียง"]'::jsonb),
  ('Pool Villa',    'pool-villa','พูลวิลล่าส่วนตัว สระว่ายน้ำในห้อง', 6500, 4, 'King + Sofa Bed', 75,
   '["WiFi","แอร์","ทีวี","มินิบาร์","สระส่วนตัว","ระเบียง","อ่างจากุซซี่"]'::jsonb)
on conflict (slug) do nothing;

-- เพิ่มห้องตัวอย่าง 8 ห้อง
do $$
declare
  std_id uuid; dlx_id uuid; villa_id uuid;
begin
  select id into std_id   from public.room_types where slug = 'standard';
  select id into dlx_id   from public.room_types where slug = 'deluxe';
  select id into villa_id from public.room_types where slug = 'pool-villa';

  insert into public.rooms (room_number, room_type_id, floor) values
    ('101', std_id, '1'), ('102', std_id, '1'), ('103', std_id, '1'),
    ('201', dlx_id, '2'), ('202', dlx_id, '2'),
    ('V1',  villa_id, 'G'), ('V2',  villa_id, 'G'), ('V3',  villa_id, 'G')
  on conflict (room_number) do nothing;
end $$;

-- ============================================================
-- ✅ DONE
-- ขั้นต่อไป: รัน `supabase gen types typescript --project-id YOUR_REF --schema public > lib/types/database.types.ts`
-- ============================================================
