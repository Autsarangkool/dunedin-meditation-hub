"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [allCheckins, setAllCheckins] = useState<any[]>([]);

  useEffect(() => {
    loadSessions();
    loadAllCheckins();
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

  async function loadAllCheckins() {
    const { data } = await supabase
      .from("checkins")
      .select(`
        *,
        sessions(*)
      `)
      .order("checkin_time", { ascending: true });

    setAllCheckins(data || []);
  }

  function getDateKey(item: any) {
  if (item.sessions?.event_date) return item.sessions.event_date;

  if (item.checkin_date) return item.checkin_date;

  if (item.checkin_time) {
    return new Date(item.checkin_time).toISOString().slice(0, 10);
  }

  return "ไม่ทราบวันที่";
}

  function getWeekKey(dateText: string) {
    const date = new Date(dateText);
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays =
      (date.getTime() - firstDay.getTime()) / 86400000;

    const week = Math.ceil(
      (pastDays + firstDay.getDay() + 1) / 7
    );

    return `${date.getFullYear()}-W${String(week).padStart(
      2,
      "0"
    )}`;
  }

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};

    allCheckins.forEach((item) => {
      const key = getDateKey(item);
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allCheckins]);

  const weeklyData = useMemo(() => {
    const map: Record<string, number> = {};

    allCheckins.forEach((item) => {
      const dateKey = getDateKey(item);
      if (dateKey === "ไม่ทราบวันที่") return;

      const week = getWeekKey(dateKey);
      map[week] = (map[week] || 0) + 1;
    });

    return Object.entries(map)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [allCheckins]);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};

    allCheckins.forEach((item) => {
      const dateKey = getDateKey(item);
      if (dateKey === "ไม่ทราบวันที่") return;

      const month = dateKey.slice(0, 7);
      map[month] = (map[month] || 0) + 1;
    });

    return Object.entries(map)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [allCheckins]);

  const sessionData = useMemo(() => {
  const map: Record<string, { session: string; count: number }> = {};
  const seen = new Set<string>();

  allCheckins.forEach((item) => {
    const sessionId = item.session_id;
    const memberId = item.member_id;

    if (!sessionId || !memberId) return;

    const uniqueKey = `${sessionId}-${memberId}`;
    if (seen.has(uniqueKey)) return;

    seen.add(uniqueKey);

    const sessionName =
      item.sessions?.session_name ||
      item.session_name ||
      "ไม่ทราบ Session";

    if (!map[sessionId]) {
      map[sessionId] = {
        session: sessionName,
        count: 0,
      };
    }

    map[sessionId].count += 1;
  });

  return Object.values(map).sort((a, b) => b.count - a.count);
}, [allCheckins]);

  const topDay = [...dailyData].sort((a, b) => b.count - a.count)[0];
const topWeek = [...weeklyData].sort((a, b) => b.count - a.count)[0];
const topMonth = [...monthlyData].sort((a, b) => b.count - a.count)[0];
const topSession = [...sessionData].sort((a, b) => b.count - a.count)[0];

const topWeekSessions = useMemo(() => {
  if (!topWeek?.week) return [];

  return sessions
    .filter((session) => getWeekKey(session.event_date) === topWeek.week)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
}, [sessions, topWeek]);

const topWeekSessionRange =
  topWeekSessions.length > 0
    ? `${topWeekSessions[0].session_name} - ${
        topWeekSessions[topWeekSessions.length - 1].session_name
      }`
    : "-";
function formatThaiMonth(monthKey: string) {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const [year, month] = monthKey.split("-");

  return `${months[Number(month) - 1]} ${year}`;
}

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">

        <a
  href="/"
  className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
>
  🏠 กลับหน้าหลัก
</a>
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Attendance Analytics Report
        </h1>

        <p className="mt-2 text-gray-600">
          วิเคราะห์จำนวนผู้เข้าร่วมรายวัน รายสัปดาห์ รายเดือน ราย Session
          และวันในสัปดาห์
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
          title="Session คนเยอะสุด"
          value={topSession?.session || "-"}
          subtitle={`${topSession?.count || 0} คน`}
          />

          <SummaryCard
  title="อาทิตย์คนเยอะสุด"
  value={
    topWeek?.week
      ? `สัปดาห์ ${topWeek.week.split("-W")[1]}`
      : "-"
  }
  subtitle={`${topWeekSessionRange} • ${topWeek?.count || 0} คน`}
/>       

          <SummaryCard
  title="เดือนคนเยอะสุด"
  value={
    topMonth?.month
      ? formatThaiMonth(topMonth.month)
      : "-"
  }
  subtitle={`${topMonth?.count || 0} คน`}
/>
          </div>

        <h2 className="mt-10 text-2xl font-bold text-[#4b5f4a]">
          รายการการเข้าร่วม / Attendance List
        </h2>

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
                    {item.members?.full_name || "-"}
                  </td>

                  <td className="border p-3">
                    {item.members?.nickname || "-"}
                  </td>

                  <td className="border p-3">
                    {item.members?.phone || "-"}
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

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border bg-[#fffdf8] p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold text-[#4b5f4a]">{value}</p>
      <p>{subtitle}</p>
    </div>
  );
}

function ChartBox({
  title,
  data,
  xKey,
}: {
  title: string;
  data: any[];
  xKey: string;
}) {
  return (
    <div className="rounded-2xl border bg-[#fffdf8] p-4">
      <h3 className="mb-4 font-bold text-[#4b5f4a]">{title}</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} fontSize={10} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}