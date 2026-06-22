"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
    } else {
      setAttendance([]);
    }
  }, [selectedSession]);

  async function loadSessions() {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setSessions(data || []);

    if (data && data.length > 0) {
      setSelectedSession(data[0].id);
    }
  }

  async function loadAttendance() {
    const { data, error } = await supabase
      .from("checkins")
      .select(
        `
        *,
        members(*)
      `
      )
      .eq("session_id", selectedSession)
      .order("checkin_time", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setAttendance(data || []);
  }

  async function loadAllCheckins() {
    const { data, error } = await supabase
      .from("checkins")
      .select(
        `
        *,
        sessions(*)
      `
      )
      .order("checkin_time", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

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

    if (Number.isNaN(date.getTime())) {
      return "ไม่ทราบสัปดาห์";
    }

    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;

    const week = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);

    return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
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
      if (week === "ไม่ทราบสัปดาห์") return;

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

  const weekdayData = useMemo(() => {
    const days = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัส",
      "ศุกร์",
      "เสาร์",
    ];

    const map: Record<string, number> = {};

    days.forEach((day) => {
      map[day] = 0;
    });

    allCheckins.forEach((item) => {
      const dateKey = getDateKey(item);
      if (dateKey === "ไม่ทราบวันที่") return;

      const date = new Date(dateKey);
      if (Number.isNaN(date.getTime())) return;

      const day = days[date.getDay()];
      map[day] = (map[day] || 0) + 1;
    });

    return days.map((day) => ({
      day,
      count: map[day] || 0,
    }));
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
        item.sessions?.session_name || item.session_name || "ไม่ทราบ Session";

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
      .filter((session) => {
        if (!session.event_date) return false;
        return getWeekKey(session.event_date) === topWeek.week;
      })
      .sort((a, b) =>
        String(a.event_date || "").localeCompare(String(b.event_date || ""))
      );
  }, [sessions, topWeek]);

  const topWeekSessionRange =
    topWeekSessions.length > 0
      ? `${topWeekSessions[0].session_name} - ${
          topWeekSessions[topWeekSessions.length - 1].session_name
        }`
      : "-";

  const selectedSessionInfo = sessions.find(
    (session) => session.id === selectedSession
  );

  function formatThaiMonth(monthKey: string) {
    if (!monthKey || !monthKey.includes("-")) return "-";

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
    const monthIndex = Number(month) - 1;

    if (!months[monthIndex]) return monthKey;

    return `${months[monthIndex]} ${year}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <ReportsBackground />

      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.65),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.45),transparent_34%)]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-6xl opacity-25">
            🕊️
          </div>
          <div className="pointer-events-none absolute bottom-8 right-24 text-5xl opacity-25">
            🌸
          </div>
          <div className="pointer-events-none absolute bottom-8 left-8 text-5xl opacity-20">
            🌿
          </div>

          <div className="relative">
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </Link>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Analytics Dashboard
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  Attendance Analytics Report
                </h1>

                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  วิเคราะห์จำนวนผู้เข้าร่วมรายวัน รายสัปดาห์ รายเดือน ราย
                  Session และวันในสัปดาห์ ด้วยมุมมองที่สบายตาและดูง่าย
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-3">
                <MiniStat label="Sessions" value={sessions.length} />
                <MiniStat label="Check-ins" value={allCheckins.length} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon="🏆"
            title="Session คนเยอะสุด"
            value={topSession?.session || "-"}
            subtitle={`${topSession?.count || 0} คน`}
            tone="emerald"
          />

          <SummaryCard
            icon="🌤️"
            title="วันที่คนเยอะสุด"
            value={topDay?.date || "-"}
            subtitle={`${topDay?.count || 0} คน`}
            tone="sky"
          />

          <SummaryCard
            icon="🌿"
            title="อาทิตย์คนเยอะสุด"
            value={topWeek?.week ? `สัปดาห์ ${topWeek.week.split("-W")[1]}` : "-"}
            subtitle={`${topWeekSessionRange} • ${topWeek?.count || 0} คน`}
            tone="amber"
          />

          <SummaryCard
            icon="🌸"
            title="เดือนคนเยอะสุด"
            value={topMonth?.month ? formatThaiMonth(topMonth.month) : "-"}
            subtitle={`${topMonth?.count || 0} คน`}
            tone="emerald"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <ChartBox title="รายวัน / Daily Attendance" data={dailyData} xKey="date" />
          <ChartBox title="รายสัปดาห์ / Weekly Attendance" data={weeklyData} xKey="week" />
          <ChartBox title="รายเดือน / Monthly Attendance" data={monthlyData} xKey="month" />
          <ChartBox title="วันในสัปดาห์ / Weekday Attendance" data={weekdayData} xKey="day" />
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-20">
            🌱
          </div>

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                  🌿 Attendance List
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
                  รายการการเข้าร่วม
                </h2>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  เลือก session เพื่อดูรายชื่อผู้เข้าร่วมในรอบนั้น
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-emerald-100 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Selected Session
                </p>
                <p className="mt-1 max-w-[280px] truncate text-lg font-black text-emerald-900">
                  {selectedSessionInfo?.session_name || "-"}
                </p>
                <p className="text-sm font-semibold text-emerald-700">
                  {attendance.length} คน
                </p>
              </div>
            </div>

            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="mt-6 h-14 w-full rounded-2xl border border-emerald-100 bg-white/85 px-4 font-semibold text-slate-700 outline-none shadow-sm backdrop-blur focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.session_name} - {session.event_date}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/80 text-sm text-emerald-900">
                  <th className="p-4 font-black">ลำดับ</th>
                  <th className="p-4 font-black">ชื่อ</th>
                  <th className="p-4 font-black">ชื่อเล่น</th>
                  <th className="p-4 font-black">โทร</th>
                  <th className="p-4 font-black">เวลาเช็คอิน</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 bg-white/55 transition hover:bg-white/90"
                  >
                    <td className="p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700 shadow-inner">
                        {index + 1}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={item.members} />

                        <span className="max-w-[260px] truncate font-black text-slate-950">
                          {item.members?.full_name || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-medium text-slate-600">
                      {item.members?.nickname || "-"}
                    </td>

                    <td className="p-4 font-medium text-slate-600">
                      {item.members?.phone || "-"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 font-bold text-sky-700">
                        {item.checkin_time
                          ? new Date(item.checkin_time).toLocaleTimeString()
                          : "-"}
                      </span>
                    </td>
                  </tr>
                ))}

                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="mx-auto max-w-md rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-10 shadow-sm backdrop-blur-xl">
                        <div className="text-5xl">🌿</div>
                        <h3 className="mt-4 text-2xl font-black text-emerald-900">
                          ยังไม่มีข้อมูลการเข้าร่วม
                        </h3>
                        <p className="mt-2 text-slate-500">
                          เมื่อมีสมาชิกเช็คอินใน session นี้ รายชื่อจะแสดงที่นี่
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function ReportsBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(135deg,#f8fbf6_0%,#fff8ec_48%,#eef9f4_100%)]"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute left-[18%] top-[-120px] h-[460px] w-[560px] rounded-full bg-sky-200/28 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-amber-200/28 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[22%] h-[520px] w-[520px] rounded-full bg-lime-200/25 blur-3xl" />

        <div className="absolute right-12 top-28 text-6xl opacity-25">🕊️</div>
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-20">
          🌿
        </div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-20">
          🌸
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 w-full opacity-30"
      >
        <svg
          viewBox="0 0 1440 240"
          className="h-auto w-full fill-sky-200"
          preserveAspectRatio="none"
        >
          <path d="M0,144L60,133.3C120,123,240,101,360,112C480,123,600,165,720,165.3C840,165,960,123,1080,122.7C1200,123,1320,165,1380,186.7L1440,208L1440,320L0,320Z" />
        </svg>
      </div>
    </>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-50 to-blue-50 text-sky-700 ring-sky-100"
      : tone === "amber"
        ? "from-amber-50 to-orange-50 text-amber-700 ring-amber-100"
        : "from-emerald-50 to-lime-50 text-emerald-700 ring-emerald-100";

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_24px_75px_rgba(15,23,42,0.13)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />

      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-inner ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 truncate text-2xl font-black text-emerald-950">
            {value}
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-700">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-emerald-700">
        {value.toLocaleString()}
      </p>
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
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="relative">
        <h3 className="mb-4 text-xl font-black text-emerald-950">{title}</h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey={xKey} fontSize={10} tickMargin={8} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MemberAvatar({ member }: { member: any }) {
  if (member?.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || ""}
        className="h-12 w-12 shrink-0 rounded-full object-cover shadow-md ring-4 ring-white"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-2xl shadow-inner ring-4 ring-white">
      🙏
    </div>
  );
}