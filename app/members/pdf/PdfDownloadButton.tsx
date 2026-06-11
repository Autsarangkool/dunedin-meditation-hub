"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import MemberPdfDocument from "./MemberPdfDocument";

export default function PdfDownloadButton({
  members,
}: {
  members: any[];
}) {
  return (
    <PDFDownloadLink
      document={<MemberPdfDocument members={members} />}
      fileName="Members_List.pdf"
      className="rounded-lg bg-red-600 px-4 py-2 text-white"
    >
      {({ loading }) =>
        loading ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"
      }
    </PDFDownloadLink>
  );
}