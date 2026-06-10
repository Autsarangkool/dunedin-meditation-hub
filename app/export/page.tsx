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

  async function exportSessions() {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      alert("Export failed: " + error.message);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data || []);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");

    XLSX.writeFile(workbook, "dunedin-sessions.xlsx");
  }

  async function exportCheckins() {
    const { data, error } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .order("checkin_time", { ascending: false });

    if (error) {
      alert("Export failed: " + error.message);
      return;
    }

    const rows =
      data?.map((item, index) => ({
        No: index + 1,
        FullName: item.members?.full_name || "",
        Nickname: item.members?.nickname || "",
        Phone: item.members?.phone || "",
        Email: item.members?.email || "",
        SessionName:
          item.sessions?.session_name || item.session_name || "",
        SessionNumber: item.sessions?.session_number || "",
        SessionDate: item.sessions?.event_date || "",
        CheckinDate: item.checkin_date || "",
        CheckinTime: item.checkin_time
          ? new Date(item.checkin_time).toLocaleTimeString()
          : "",
      })) || [];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Checkins");

    XLSX.writeFile(workbook, "dunedin-checkins.xlsx");
  }

  async function exportAttendanceReport() {
    const { data: members, error: memberError } = await supabase
      .from("members")
      .select("*");

    if (memberError) {
      alert("Export failed: " + memberError.message);
      return;
    }

    const { data: checkins, error: checkinError } = await supabase
      .from("checkins")
      .select("*, sessions(*)")
      .order("checkin_time", { ascending: false });

    if (checkinError) {
      alert("Export failed: " + checkinError.message);
      return;
    }

    const rows =
      members?.map((member) => {
        const memberCheckins =
          checkins?.filter((item) => item.member_id === member.id) || [];

        const latest = memberCheckins[0];

        return {
          FullName: member.full_name || "",
          Nickname: member.nickname || "",
          Phone: member.phone || "",
          Email: member.email || "",
          TotalAttendances: memberCheckins.length,
          LatestDate: latest?.checkin_date || "",
          LatestSession:
            latest?.sessions?.session_name ||
            latest?.session_name ||
            "",
        };
      }) || [];

    rows.sort((a, b) => b.TotalAttendances - a.TotalAttendances);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    XLSX.writeFile(workbook, "dunedin-attendance-report.xlsx");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Export Excel / ส่งออกข้อมูล
        </h1>

        <p className="mt-2 text-gray-600">
          ดาวน์โหลดข้อมูลจากระบบ Dunedin Meditation Hub เป็นไฟล์ Excel
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            onClick={exportMembers}
            className="rounded-xl bg-green-700 px-6 py-4 font-semibold text-white hover:bg-green-800"
          >
            Export Members
          </button>

          <button
            onClick={exportAttendanceReport}
            className="rounded-xl bg-blue-700 px-6 py-4 font-semibold text-white hover:bg-blue-800"
          >
            Export Attendance Report
          </button>

          <button
            onClick={exportCheckins}
            className="rounded-xl bg-purple-700 px-6 py-4 font-semibold text-white hover:bg-purple-800"
          >
            Export Check-ins
          </button>

          <button
            onClick={exportSessions}
            className="rounded-xl bg-orange-700 px-6 py-4 font-semibold text-white hover:bg-orange-800"
          >
            Export Sessions
          </button>
        </div>
      </div>
    </main>
  );
}