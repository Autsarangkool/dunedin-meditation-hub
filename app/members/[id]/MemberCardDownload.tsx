"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import * as QRCode from "qrcode";
import { useEffect, useState } from "react";
import MemberCardPDF from "./MemberCardPDF";

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
  const checkinUrl =
    `${window.location.origin}/checkin/qr/${member.id}`;

  QRCode.toDataURL(checkinUrl).then((url: string) => {
    setQrUrl(url);
  });
}, [member.id]);

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
      className="rounded-xl bg-[#4b5f4a] px-6 py-3 text-center font-semibold text-white"
    >
      {({ loading }) =>
        loading ? "กำลังเตรียม PDF..." : "ดาวน์โหลดบัตรสมาชิก PDF"
      }
    </PDFDownloadLink>
  );
}