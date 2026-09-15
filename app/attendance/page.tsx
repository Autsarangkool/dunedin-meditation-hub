"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MemberReportRow = {
  id: string;
  full_name?: string | null;
  nickname?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  totalAttendances: number;
  latestDate: string;
  latestSession: string;
  [key: string]: any;
};

const CHECKIN_PAGE_SIZE = 1000;

async function loadAllCheckins() {
  const allCheckins: any[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("checkins")
      .select("*, sessions(*)")
      .order("checkin_time", { ascending: false })
      .range(from, from + CHECKIN_PAGE_SIZE - 1);

    if (error) return { data: null, error };

    const page = data || [];
    allCheckins.push(...page);

    if (page.length < CHECKIN_PAGE_SIZE) break;
    from += CHECKIN_PAGE_SIZE;
  }

  return { data: allCheckins, error: null };
}

export default function AttendancePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      { data: memberData, error: memberError },
      { data: checkinData, error: checkinError },
    ] = await Promise.all([
      supabase
        .from("members")
        .select("*")
        .eq("is_deleted", false),
      loadAllCheckins(),
    ]);

    setLoading(false);

    if (memberError) {
      alert(memberError.message);
      return;
    }

    if (checkinError) {
      alert(checkinError.message);
      return;
    }

    setMembers(memberData || []);
    setCheckins(checkinData || []);
  }

  const reportRows = useMemo<MemberReportRow[]>(() => {
    const statsByMember = new Map<
      string,
      {
        total: number;
        latestDate: string;
        latestSession: string;
      }
    >();

    checkins.forEach((checkin) => {
      const memberId = checkin.member_id;

      if (!memberId) return;

      const current = statsByMember.get(memberId);

      if (!current) {
        statsByMember.set(memberId, {
          total: 1,
          latestDate: checkin.checkin_date || "-",
          latestSession:
            checkin.sessions?.session_name ||
            checkin.session_name ||
            "-",
        });
        return;
      }

      current.total += 1;
    });

    const keyword = search.trim().toLowerCase();

    return members
      .map((member) => {
        const stats = statsByMember.get(member.id);

        return {
          ...member,
          totalAttendances: stats?.total || 0,
          latestDate: stats?.latestDate || "-",
          latestSession: stats?.latestSession || "-",
        };
      })
      .filter((member) => member.totalAttendances > 0)
      .filter((member) => {
        if (!keyword) return true;

        const searchableText = [
          member.full_name,
          member.nickname,
          member.phone,
          member.email,
        ]
          .filter(Boolean)
          .map(String)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .sort((a, b) => {
        if (b.totalAttendances !== a.totalAttendances) {
          return b.totalAttendances - a.totalAttendances;
        }

        return String(a.full_name || "").localeCompare(
          String(b.full_name || ""),
          ["en", "th"],
          { sensitivity: "base" }
        );
      });
  }, [members, checkins, search]);

  const membersWithAttendance = useMemo(
    () =>
      members.filter((member) =>
        checkins.some((checkin) => checkin.member_id === member.id)
      ).length,
    [members, checkins]
  );

  const topMember = reportRows.find(
    (member) => member.totalAttendances > 0
  );

  function escapeCSV(value: unknown) {
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

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];

    downloadLink.href = url;
    downloadLink.download = `attendance-report-${today}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-7">
      <AttendanceBackground />

      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[2.4rem] border border-sky-100/90 bg-white/82 p-5 shadow-[0_30px_95px_rgba(56,189,248,0.16)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.76),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(167,243,208,0.36),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,249,255,0.80))]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[390px] lg:block xl:w-[470px]">
            <AttendanceWinterIllustration />
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl"
              >
                🏠 กลับหน้าหลัก
              </Link>

              <button
                type="button"
                onClick={exportAttendanceCSV}
                disabled={loading || reportRows.length === 0}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                ⇩ Export Attendance CSV
              </button>
            </div>

            <div className="mt-8 max-w-3xl lg:max-w-[65%]">
              <p className="inline-flex rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600 shadow-sm backdrop-blur">
                ❄️ Attendance Report
              </p>

              <h1 className="winter-title mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                รายงานการเข้าร่วม
              </h1>

              <p className="mt-2 text-xl font-black text-sky-700">
                Attendance Report
              </p>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                สรุปจำนวนครั้งที่สมาชิกแต่ละคนเข้าร่วม
                พร้อมวันที่และ Session ล่าสุด เพื่อดูภาพรวมได้อย่างรวดเร็ว
              </p>
            </div>

            <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
              <MiniStat
                label="สมาชิกทั้งหมด"
                value={members.length}
                icon="👥"
              />
              <MiniStat
                label="ผลการค้นหา"
                value={reportRows.length}
                icon="🔎"
              />
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-5 md:grid-cols-3">
          <ReportStatCard
            icon="👥"
            title="สมาชิกทั้งหมด"
            value={members.length}
            subtitle="Total Members"
            tone="blue"
          />

          <ReportStatCard
            icon="✓"
            title="เช็คอินทั้งหมด"
            value={checkins.length}
            subtitle="Total Check-ins"
            tone="sky"
          />

          <ReportStatCard
            icon="❄️"
            title="สมาชิกที่เคยมา"
            value={membersWithAttendance}
            subtitle="Members Attended"
            tone="emerald"
          />
        </section>

        <section className="relative mt-7 overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 p-5 shadow-[0_24px_78px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-5 right-7 text-5xl opacity-15">
            ❄️
          </div>

          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">
                  ❄️ Attendance List
                </p>

                <h2 className="winter-title mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  รายการการเข้าร่วม
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  เรียงตามจำนวนครั้งที่เข้าร่วมมากที่สุด
                </p>
              </div>

              {topMember && (
                <div className="relative overflow-hidden rounded-[1.6rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50/80 to-emerald-50/70 px-5 py-4 shadow-sm">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/45 blur-2xl" />

                  <div className="relative">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-500">
                      🏆 Top Attendee
                    </p>
                    <p className="mt-1 max-w-[280px] truncate text-lg font-black text-slate-950">
                      {topMember.full_name || "-"}
                    </p>
                    <p className="text-sm font-black text-emerald-600">
                      {topMember.totalAttendances.toLocaleString()} ครั้ง
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="relative overflow-hidden rounded-[1.6rem] border border-sky-200/80 bg-white/88 p-2 shadow-[0_16px_42px_rgba(14,165,233,0.12)] transition focus-within:-translate-y-0.5 focus-within:border-sky-400 focus-within:shadow-[0_20px_55px_rgba(14,165,233,0.20)]">
                <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/45 blur-2xl" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 text-xl shadow-sm">
                    🔎
                  </div>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล..."
                    className="h-14 min-w-0 flex-1 bg-transparent px-1 text-base font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 shadow-[0_24px_80px_rgba(56,189,248,0.12)] backdrop-blur-2xl">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
              <p className="mt-4 font-bold text-slate-500">
                Loading attendance report...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-sky-100 bg-gradient-to-r from-sky-50/95 via-white to-emerald-50/85 text-sm text-slate-800">
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
                      className="border-b border-sky-50 bg-white/50 transition hover:bg-sky-50/55"
                    >
                      <td className="p-4">
                        <RankBadge rank={index + 1} />
                      </td>

                      <td className="p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <MemberAvatar member={member} />

                          <div className="min-w-0">
                            <p className="max-w-[270px] truncate font-black text-slate-950">
                              {member.full_name || "-"}
                            </p>
                            <p className="mt-0.5 max-w-[270px] truncate text-xs font-medium text-slate-400">
                              {member.email || member.phone || "Member"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-600">
                        {member.nickname || "-"}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                          {member.totalAttendances.toLocaleString()} ครั้ง
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-slate-600">
                        {member.latestDate}
                      </td>

                      <td className="p-4">
                        <span className="block max-w-[260px] truncate font-semibold text-slate-600">
                          {member.latestSession}
                        </span>
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-4 py-2 text-sm font-black text-white shadow-md shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
                        >
                          ดูข้อมูล
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {reportRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="mx-auto max-w-md rounded-[2rem] border border-dashed border-sky-200 bg-white/72 px-6 py-10 shadow-sm backdrop-blur-xl">
                          <div className="mx-auto w-40">
                            <EmptyAttendanceIllustration />
                          </div>
                          <h3 className="winter-title mt-4 text-2xl font-black">
                            ไม่พบข้อมูล
                          </h3>
                          <p className="mt-2 font-medium text-slate-500">
                            ลองเปลี่ยนคำค้นหา หรือกดปุ่ม ✕ เพื่อล้างช่องค้นหา
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AttendanceBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute left-[16%] top-[-140px] h-[480px] w-[590px] rounded-full bg-cyan-200/34 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-blue-100/55 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[20%] h-[540px] w-[540px] rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="absolute right-12 top-28 text-6xl opacity-20">
          ❄️
        </div>
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-16">
          🌲
        </div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-16">
          ☃️
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

function AttendanceWinterIllustration() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="h-auto w-full drop-shadow-[0_20px_28px_rgba(56,189,248,0.16)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="attendanceSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9f8ff" />
          <stop offset="58%" stopColor="#c8edff" />
          <stop offset="100%" stopColor="#edfff8" />
        </linearGradient>
        <linearGradient id="attendanceSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#def3ff" />
        </linearGradient>
      </defs>

      <path
        d="M20 215 112 112l65 65 70-105 100 113 61-59 92 80v94H20Z"
        fill="url(#attendanceSky)"
      />
      <path
        d="M20 235c86-37 154-31 221 3 70 36 144 36 259-4v66H20Z"
        fill="url(#attendanceSnow)"
      />

      <g transform="translate(292 140)">
        <rect x="18" y="52" width="108" height="72" rx="9" fill="#d68c58" />
        <path d="M6 61 72 12l67 49Z" fill="#925a46" />
        <path d="M6 61 72 12l67 49-9 5-58-43-58 43Z" fill="#ffffff" />
        <rect x="60" y="82" width="25" height="42" rx="3" fill="#6c4234" />
        <rect x="31" y="76" width="19" height="19" rx="3" fill="#ffe6a4" />
        <rect x="98" y="76" width="19" height="19" rx="3" fill="#ffe6a4" />
      </g>

      <g transform="translate(407 164)">
        <circle cx="34" cy="66" r="30" fill="#ffffff" />
        <circle cx="34" cy="28" r="22" fill="#ffffff" />
        <circle cx="27" cy="25" r="3" fill="#23496c" />
        <circle cx="42" cy="25" r="3" fill="#23496c" />
        <path d="m34 31 12 4-12 4Z" fill="#ff9f43" />
        <path
          d="M21 39c9 7 18 7 27 0"
          fill="none"
          stroke="#55b7cf"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M17 15c5-19 29-21 37-3l-5 6H21Z" fill="#4a91df" />
      </g>

      <g fill="#68add5">
        <path d="M63 250 84 207l21 43Z" />
        <path d="M70 228 84 195l15 33Z" />
        <rect x="81" y="247" width="6" height="20" rx="3" />

        <path d="M180 265 202 219l22 46Z" />
        <path d="M187 241 202 206l15 35Z" />
        <rect x="199" y="262" width="6" height="20" rx="3" />
      </g>

      <g transform="translate(235 197)">
        <rect x="0" y="0" width="54" height="62" rx="10" fill="#ffffff" />
        <rect x="10" y="12" width="34" height="6" rx="3" fill="#7dd3fc" />
        <rect x="10" y="27" width="25" height="5" rx="2.5" fill="#a7f3d0" />
        <rect x="10" y="40" width="31" height="5" rx="2.5" fill="#bfdbfe" />
      </g>

      {[75, 145, 220, 292, 372, 456].map((x, index) => (
        <g
          key={x}
          transform={`translate(${x} ${index % 2 ? 58 : 38})`}
          opacity="0.72"
        >
          <path
            d="M0-11V11M-11 0H11M-7-7 7 7M7-7-7 7"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
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
  tone: "blue" | "sky" | "emerald";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-50 to-cyan-100 text-sky-700 ring-sky-100"
      : tone === "emerald"
        ? "from-emerald-50 to-cyan-100 text-emerald-700 ring-emerald-100"
        : "from-blue-50 to-sky-100 text-blue-700 ring-blue-100";

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/80 p-6 shadow-[0_18px_55px_rgba(56,189,248,0.1)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_24px_75px_rgba(56,189,248,0.16)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />

      <div className="relative flex items-center gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-inner ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-4xl font-black text-slate-950">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-sky-100/90 bg-white/78 p-4 shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-100 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 text-xl shadow-inner ring-1 ring-sky-100">
          {icon}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-0.5 text-3xl font-black text-sky-700">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const rankClass =
    rank === 1
      ? "from-amber-300 to-yellow-500 text-amber-950"
      : rank === 2
        ? "from-slate-200 to-slate-400 text-slate-800"
        : rank === 3
          ? "from-orange-200 to-orange-400 text-orange-950"
          : "from-sky-100 to-emerald-100 text-sky-800";

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-black shadow-inner ring-1 ring-white ${rankClass}`}
    >
      {rank}
    </div>
  );
}

function MemberAvatar({ member }: { member: MemberReportRow }) {
  if (member.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || "Member"}
        className="h-12 w-12 shrink-0 rounded-full object-cover shadow-md ring-4 ring-white"
      />
    );
  }

  const initials = String(member.full_name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400 text-sm font-black text-white shadow-md ring-4 ring-white">
      {initials || "?"}
    </div>
  );
}

function EmptyAttendanceIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="80" ry="10" fill="#dbeafe" />

      <g transform="translate(87 44)">
        <circle cx="34" cy="58" r="29" fill="#ffffff" />
        <circle cx="34" cy="22" r="21" fill="#ffffff" />
        <circle cx="27" cy="19" r="2.5" fill="#23496c" />
        <circle cx="41" cy="19" r="2.5" fill="#23496c" />
        <path d="m34 25 11 3-11 4Z" fill="#ff9f43" />
        <path
          d="M22 34c8 6 16 6 24 0"
          fill="none"
          stroke="#55b7cf"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M18 10c4-18 27-20 35-3l-5 6H22Z" fill="#4a91df" />
      </g>

      <g stroke="#91c8e8" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M42 52v24M30 64h24M34 56l16 16M50 56 34 72" />
        <path d="M196 40v20M186 50h20M189 43l14 14M203 43l-14 14" />
        <path d="M188 105v18M179 114h18M182 108l12 12M194 108l-12 12" />
      </g>

      <path
        d="M48 122c17-19 30-25 46-29-11 15-23 25-46 29Z"
        fill="#6ee7b7"
        opacity="0.72"
      />
      <path
        d="M192 122c-17-19-30-25-46-29 11 15 23 25 46 29Z"
        fill="#93c5fd"
        opacity="0.78"
      />
    </svg>
  );
}
