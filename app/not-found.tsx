import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm tracking-wider uppercase">
        404
      </p>
      <h1 className="font-serif text-4xl">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        หน้าที่คุณกำลังหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
      </p>
      <Link href="/" className={buttonVariants()}>
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
