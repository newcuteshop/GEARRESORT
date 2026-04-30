import { LoginForm } from "./login-form";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata = {
  title: `เข้าสู่ระบบ — ${APP_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 lg:block">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <span className="font-serif text-xl">G</span>
            </div>
            <span className="font-serif text-xl">{APP_NAME}</span>
          </div>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl leading-tight">
              Welcome back to
              <br />
              your resort.
            </h1>
            <p className="max-w-md text-white/80">
              ระบบจัดการรีสอร์ทแบบครบวงจร — การจอง, ห้องพัก, ลูกค้า,
              ใบแจ้งหนี้ และทีมแม่บ้าน ในที่เดียว
            </p>
          </div>
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-muted-foreground text-sm tracking-wider uppercase">
              {APP_TAGLINE}
            </p>
            <h2 className="font-serif text-3xl">เข้าสู่ระบบ</h2>
            <p className="text-muted-foreground text-sm">
              ยินดีต้อนรับกลับ — กรุณากรอกข้อมูลด้านล่าง
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
