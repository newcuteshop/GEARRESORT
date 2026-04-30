-- ============================================================
-- 0002 — User per-menu permissions
-- ============================================================

-- เพิ่ม column permissions (array ของ menu key)
alter table public.profiles
  add column if not exists permissions text[] not null default '{}';

-- Backfill: ตั้งสิทธิเริ่มต้นให้ผู้ใช้เดิม โดยดูจาก role
update public.profiles
set permissions = case role
  when 'admin' then array[
    'dashboard','bookings','rooms','rooms_types','guests',
    'billing','housekeeping','settings'
  ]
  when 'receptionist' then array[
    'dashboard','bookings','rooms','guests','billing','housekeeping'
  ]
  when 'housekeeping' then array[
    'dashboard','rooms','housekeeping'
  ]
  else array['dashboard']::text[]
end
where coalesce(array_length(permissions, 1), 0) = 0;
