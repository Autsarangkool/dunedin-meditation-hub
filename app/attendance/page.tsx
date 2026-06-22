"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AttendancePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*");

    if (memberError) {
      alert(memberError.message);
      return;
    }

    const { data: checkinData, error: checkinError } = await supabase
      .from("checkins")
      .select("*, sessions(*)")
      .order("checkin_time", { ascending: false });

    if (checkinError) {
      alert(checkinError.message);
      return;
    }

    setMembers(memberData || []);
    setCheckins(checkinData || []);
  }

  function getMemberStats(member: any) {
    const memberCheckins = checkins.filter(
      (item) => item.member_id === member.id
    );

    const latestCheckin = memberCheckins[0];

    return {
      total: memberCheckins.length,
      latestDate: latestCheckin?.checkin_date || "-",
      latestSession:
        latestCheckin?.sessions?.session_name ||
        latestCheckin?.session_name ||
        "-",
    };
  }

  const reportRows = useMemo(() => {
    return members
      .map((member) => {
        const stats = getMemberStats(member);

        return {
          ...member,
          totalAttendances: stats.total,
          latestDate: stats.latestDate,
          latestSession: stats.latestSession,
        };
      })
      .filter((member) => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return true;

        return (
          member.full_name?.toLowerCase().includes(keyword) ||
          member.nickname?.toLowerCase().includes(keyword) ||
          member.phone?.toLowerCase().includes(keyword) ||
          member.email?.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => b.totalAttendances - a.totalAttendances);
  }, [members, checkins, search]);

  const membersWithAttendance = reportRows.filter(
    (member) => member.totalAttendances > 0
  ).length;

  const topMember = reportRows.find((member) => member.totalAttendances > 0);

  function escapeCSV(value: any) {
    if (value === null || value === undefined) return "";

    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  }

  function exportAttendanceCSV() {
    if (reportRows.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const headers = [
      "Rank",
      "Full Name",
      "Nickname",
      "Phone",
      "Email",
      "Total Attendances",
      "Latest Date",
      "Latest Session",
    ];

    const rows = reportRows.map((member, index) => [
      index + 1,
      member.full_name || "",
      member.nickname || "",
      member.phone || "",
      member.email || "",
      member.totalAttendances || 0,
      member.latestDate || "",
      member.latestSession || "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const today = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `attendance-report-${today}.csv`;
    link.click();

    URL.revokeObjectURL(url);
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
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                🏠 กลับหน้าหลัก
              </Link>

              <button
                onClick={exportAttendanceCSV}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Export Attendance CSV
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Attendance Report
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  รายงานการเข้าร่วม / Attendance Report
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  สรุปจำนวนครั้งที่สมาชิกแต่ละคนเข้าร่วม พร้อมข้อมูลล่าสุด
                  เพื่อดูภาพรวมการมาเข้าร่วมกิจกรรมอย่างสบายตา
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-3">
                <MiniStat label="สมาชิกทั้งหมด" value={members.length} />
                <MiniStat label="ผลการค้นหา" value={reportRows.length} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <ReportStatCard
            icon="👥"
            title="สมาชิกทั้งหมด"
            value={members.length}
            subtitle="Total Members"
            tone="emerald"
          />

          <ReportStatCard
            icon="✓"
            title="เช็คอินทั้งหมด"
            value={checkins.length}
            subtitle="Total Check-ins"
            tone="sky"
          />

          <ReportStatCard
            icon="🌿"
            title="สมาชิกที่เคยมา"
            value={membersWithAttendance}
            subtitle="Members Attended"
            tone="amber"
          />
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
                  เรียงตามจำนวนครั้งที่เข้าร่วมมากที่สุด
                </p>
              </div>

              {topMember && (
                <div className="rounded-[1.75rem] border border-emerald-100 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Top Attendee
                  </p>
                  <p className="mt-1 max-w-[260px] truncate text-lg font-black text-emerald-900">
                    {topMember.full_name || "-"}
                  </p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {topMember.totalAttendances} ครั้ง
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl">
                  🔎
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล"
                  className="h-16 w-full rounded-3xl border border-emerald-100 bg-white/85 pl-14 pr-5 text-base font-medium text-slate-800 shadow-inner outline-none backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50/80 text-sm text-emerald-900">
                  <th className="p-4 font-black">อันดับ</th>
                  <th className="p-4 font-black">สมาชิก</th>
                  <th className="p-4 font-black">ชื่อเล่น</th>
                  <th className="p-4 font-black">จำนวนครั้ง</th>
                  <th className="p-4 font-black">มาล่าสุด</th>
                  <th className="p-4 font-black">Session ล่าสุด</th>
                  <th className="p-4 font-black">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {reportRows.map((member, index) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-100 bg-white/55 transition hover:bg-white/90"
                  >
                    <td className="p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700 shadow-inner">
                        {index + 1}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar member={member} />

                        <span className="max-w-[260px] truncate font-black text-slate-950">
                          {member.full_name || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      {member.nickname || "-"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-black text-emerald-700">
                        {member.totalAttendances} ครั้ง
                      </span>
                    </td>

                    <td className="p-4 font-medium text-slate-600">
                      {member.latestDate}
                    </td>

                    <td className="p-4">
                      <span className="line-clamp-1 font-medium text-slate-600">
                        {member.latestSession}
                      </span>
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/members/${member.id}`}
                        className="rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg"
                      >
                        ดูข้อมูล
                      </Link>
                    </td>
                  </tr>
                ))}

                {reportRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <div className="mx-auto max-w-md rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-10 shadow-sm backdrop-blur-xl">
                        <div className="text-5xl">🌿</div>
                        <h3 className="mt-4 text-2xl font-black text-emerald-900">
                          ไม่พบข้อมูล
                        </h3>
                        <p className="mt-2 text-slate-500">
                          ลองเปลี่ยนคำค้นหา หรือเคลียร์ช่องค้นหาอีกครั้ง
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

function ReportStatCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: string;
  title: string;
  value: number;
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
      <div className="relative flex items-center gap-5">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-inner ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-4xl font-black text-slate-900">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
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

function MemberAvatar({ member }: { member: any }) {
  if (member.profile_photo_url) {
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