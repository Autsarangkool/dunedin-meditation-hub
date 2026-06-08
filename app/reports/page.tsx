"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance();
    }
  }, [selectedSession]);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    setSessions(data || []);

    if (data && data.length > 0) {
      setSelectedSession(data[0].id);
    }
  }

  async function loadAttendance() {
    const { data } = await supabase
      .from("checkins")
      .select(`
        *,
        members(*)
      `)
      .eq("session_id", selectedSession);

    setAttendance(data || []);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Attendance Report
        </h1>

        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="mt-6 w-full rounded-xl border p-3"
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.session_name} - {session.event_date}
            </option>
          ))}
        </select>

        <div className="mt-6 rounded-xl border bg-[#fffdf8] p-4">
          <p className="text-lg font-semibold">
            ผู้เข้าร่วมทั้งหมด: {attendance.length} คน
          </p>
        </div>

        <div className="mt-6 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f7f3ea]">
                <th className="border p-3 text-left">ชื่อ</th>
                <th className="border p-3 text-left">ชื่อเล่น</th>
                <th className="border p-3 text-left">โทร</th>
                <th className="border p-3 text-left">เวลาเช็คอิน</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((item) => (
                <tr key={item.id}>
                  <td className="border p-3">
                    {item.members?.full_name}
                  </td>

                  <td className="border p-3">
                    {item.members?.nickname}
                  </td>

                  <td className="border p-3">
                    {item.members?.phone}
                  </td>

                  <td className="border p-3">
                    {item.checkin_time
                      ? new Date(item.checkin_time).toLocaleTimeString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {attendance.length === 0 && (
            <p className="mt-4 text-gray-500">
              ยังไม่มีข้อมูลการเข้าร่วม
            </p>
          )}
        </div>
      </div>
    </main>
  );
}