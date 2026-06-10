"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QRCodeCard({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const qrUrl = `https://dunedin-meditation-hub.vercel.app/checkin/qr/${memberId}`;

  return (
    <div className="mt-5 w-full rounded-2xl border bg-white p-4 text-center">
      <p className="font-semibold text-[#4b5f4a]">QR Check-in</p>

      <div className="mt-4 flex justify-center">
        <QRCodeSVG value={qrUrl} size={160} />
      </div>

      <p className="mt-3 text-sm text-gray-600">{memberName}</p>

      <a
        href={qrUrl}
        className="mt-4 block rounded-xl bg-blue-700 px-4 py-2 text-white"
      >
        เปิดหน้า QR Check-in
      </a>
    </div>
  );
}