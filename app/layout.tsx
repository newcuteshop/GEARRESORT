import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GEARRESORT — ระบบจัดการรีสอร์ท",
  description: "ระบบจัดการรีสอร์ทแบบครบวงจร: การจอง, ห้องพัก, ลูกค้า, การเงิน, แม่บ้าน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${jakarta.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
