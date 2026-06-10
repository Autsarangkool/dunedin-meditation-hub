"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export default function ImportPage() {
  const [message, setMessage] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("กำลังอ่านไฟล์... / Reading file...");

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const { error } = await supabase.from("members").insert(rows);

    if (error) {
      setMessage("นำเข้าไม่สำเร็จ / Import failed: " + error.message);
      return;
    }

    setMessage(`นำเข้าสำเร็จ / Imported successfully: ${rows.length} records`);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-md">
        <a
  href="/"
  className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
>
  🏠 กลับหน้าหลัก
</a>
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          นำเข้าข้อมูลจาก Excel / Import Excel
        </h1>

        <p className="mt-2 text-gray-600">
          อัปโหลดไฟล์ Excel สมาชิกเก่า / Upload old member Excel file
        </p>

        <div className="mt-8 rounded-2xl border border-dashed p-8">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="w-full"
          />
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            {message}
          </p>
        )}

        <div className="mt-8 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-900">
          Excel ต้องมีหัวคอลัมน์ เช่น full_name, nickname, phone, email, age
        </div>
      </div>
    </main>
  );
}