"use client";

import dynamic from "next/dynamic";
import * as QRCode from "qrcode";
import { useEffect, useState } from "react";
import MemberCardPDF from "./MemberCardPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export default function MemberCardDownload({
  member,
}: {
  member: {
    id: string;
    full_name?: string | null;
    profile_photo_url?: string | null;
  };
}) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    async function generateQR() {
      const checkinUrl = `${window.location.origin}/checkin/qr/${member.id}`;
      const url = await QRCode.toDataURL(checkinUrl);
      setQrUrl(url);
    }

    generateQR();
  }, [member.id]);

  if (!qrUrl) {
    return (
      <button disabled className="rounded-xl bg-gray-400 px-6 py-3 text-white">
        กำลังเตรียม PDF...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <MemberCardPDF
          name={member.full_name || "-"}
          photoUrl={member.profile_photo_url || undefined}
          qrUrl={qrUrl}
        />
      }
      fileName={`member-card-${member.full_name || member.id}.pdf`}
      className="rounded-xl bg-[#4b5f4a] px-6 py-3 text-white"
    >
      {({ loading }: any) =>
        loading ? "กำลังสร้าง PDF..." : "📄 ดาวน์โหลดบัตรสมาชิก PDF"
      }
    </PDFDownloadLink>
  );
}