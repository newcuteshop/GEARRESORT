"use client";

import { useState } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoicePrintButton({
  invoiceNumber,
}: {
  invoiceNumber: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const node = document.getElementById("invoice-printable");
      if (!node) return;
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(img, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(img, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${invoiceNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" /> พิมพ์
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={downloadPdf}
        disabled={downloading}
      >
        <Download className="size-4" />{" "}
        {downloading ? "กำลังสร้าง..." : "ดาวน์โหลด PDF"}
      </Button>
    </div>
  );
}
