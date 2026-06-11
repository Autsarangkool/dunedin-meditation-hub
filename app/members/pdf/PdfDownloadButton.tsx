"use client";

import { useEffect, useState } from "react";
import MemberPdfDocument from "./MemberPdfDocument";

export default function PdfDownloadButton({
  members,
}: {
  members: any[];
}) {
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null);

  useEffect(() => {
    import("@react-pdf/renderer").then((mod) => {
      setPDFDownloadLink(() => mod.PDFDownloadLink);
    });
  }, []);

  if (!PDFDownloadLink) {
    return (
      <button
        disabled
        className="rounded-lg bg-gray-400 px-4 py-2 text-white"
      >
        กำลังโหลด PDF...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<MemberPdfDocument members={members} />}
      fileName="Members_List.pdf"
      className="rounded-lg bg-red-600 px-4 py-2 text-white"
    >
      {({ loading }: { loading: boolean }) =>
        loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"
      }
    </PDFDownloadLink>
  );
}