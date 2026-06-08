"use client";

import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export default function ExportPage() {
  async function exportMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Export failed: " + error.message);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data || []);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    XLSX.writeFile(workbook, "dunedin-members.xlsx");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Export Excel / ส่งออกข้อมูล
        </h1>

        <p className="mt-2 text-gray-600">
          ดาวน์โหลดรายชื่อสมาชิกทั้งหมดเป็นไฟล์ Excel
        </p>

        <button
          onClick={exportMembers}
          className="mt-8 rounded-xl bg-green-700 px-6 py-3 text-white"
        >
          Export Members
        </button>
      </div>
    </main>
  );
}