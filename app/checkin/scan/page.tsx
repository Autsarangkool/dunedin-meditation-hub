"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScannerPage() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();

        window.location.href = decodedText;
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          QR Scanner
        </h1>

        <p className="mt-2 text-gray-600">
          เปิดกล้องเพื่อสแกน QR สมาชิก
        </p>

        <div
          id="reader"
          className="mt-6 overflow-hidden rounded-2xl border"
        />

        <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
          เมื่อสแกน QR สำเร็จ ระบบจะพาไปหน้าเช็คอินอัตโนมัติ
        </div>
      </div>
    </main>
  );
}