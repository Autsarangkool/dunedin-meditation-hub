"use client";

import { type ReactNode, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  async function runExport(key: string, task: () => Promise<void>) {
    setExporting(key);

    try {
      await task();
    } finally {
      setExporting(null);
    }
  }

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
        SessionName: item.sessions?.session_name || item.session_name || "",
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
            latest?.sessions?.session_name || latest?.session_name || "",
        };
      }) || [];

    rows.sort((a, b) => b.TotalAttendances - a.TotalAttendances);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, "dunedin-attendance-report.xlsx");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <ExportBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/72 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
            <a
              href="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </a>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Export Data
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  Export Excel / ส่งออกข้อมูล
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  ดาวน์โหลดข้อมูลจากระบบ Dunedin Meditation Hub เป็นไฟล์ Excel
                  สำหรับสำรองข้อมูล วิเคราะห์ต่อ หรือจัดทำรายงาน
                </p>
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <MiniStat label="รูปแบบไฟล์" value="XLSX" text />
                <MiniStat label="หมวดข้อมูล" value={4} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <ExportActionCard
            icon="👥"
            title="Export Members"
            subtitle="ส่งออกข้อมูลสมาชิกทั้งหมด"
            description="รวมข้อมูลสมาชิก เช่น ชื่อเล่น เบอร์โทร อีเมล อายุ และข้อมูลอื่น ๆ ใน table members"
            tone="emerald"
            loading={exporting === "members"}
            onClick={() => runExport("members", exportMembers)}
          />

          <ExportActionCard
            icon="📊"
            title="Export Attendance Report"
            subtitle="ส่งออกรายงานการเข้าร่วม"
            description="สรุปจำนวนครั้งที่สมาชิกแต่ละคนเข้าร่วม พร้อมวันที่และ session ล่าสุด"
            tone="sky"
            loading={exporting === "attendance"}
            onClick={() => runExport("attendance", exportAttendanceReport)}
          />

          <ExportActionCard
            icon="✓"
            title="Export Check-ins"
            subtitle="ส่งออกข้อมูลเช็คอินทั้งหมด"
            description="รวมชื่อสมาชิก session วันที่เช็คอิน และเวลาเช็คอินทั้งหมด"
            tone="purple"
            loading={exporting === "checkins"}
            onClick={() => runExport("checkins", exportCheckins)}
          />

          <ExportActionCard
            icon="📅"
            title="Export Sessions"
            subtitle="ส่งออกข้อมูลรอบกิจกรรม"
            description="รวมข้อมูล session ทั้งหมด เช่น ชื่อรุ่น รหัสรุ่น วันที่ และข้อมูลที่เกี่ยวข้อง"
            tone="amber"
            loading={exporting === "sessions"}
            onClick={() => runExport("sessions", exportSessions)}
          />
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <InfoCard title="ไฟล์ที่ได้" icon="📁">
            ระบบจะดาวน์โหลดเป็นไฟล์ Excel นามสกุล{" "}
            <strong>.xlsx</strong> ลงเครื่องทันทีหลัง export สำเร็จ
          </InfoCard>

          <InfoCard title="คำแนะนำ" icon="🍃">
            ควร export ข้อมูลเป็นระยะเพื่อสำรองข้อมูลก่อน deploy หรือก่อนแก้ไข
            database สำคัญ
          </InfoCard>
        </section>
      </div>
    </main>
  );
}

function ExportBackground() {
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

function ExportActionCard({
  icon,
  title,
  subtitle,
  description,
  tone,
  loading,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  tone: "emerald" | "sky" | "purple" | "amber";
  loading: boolean;
  onClick: () => void;
}) {
  const tones = {
    emerald: {
      icon: "from-emerald-50 to-lime-50 text-emerald-700 ring-emerald-100",
      button: "from-emerald-600 to-teal-600 shadow-emerald-100",
      glow: "bg-emerald-200/40",
    },
    sky: {
      icon: "from-sky-50 to-blue-50 text-sky-700 ring-sky-100",
      button: "from-sky-600 to-blue-600 shadow-sky-100",
      glow: "bg-sky-200/40",
    },
    purple: {
      icon: "from-purple-50 to-fuchsia-50 text-purple-700 ring-purple-100",
      button: "from-purple-600 to-fuchsia-600 shadow-purple-100",
      glow: "bg-purple-200/35",
    },
    amber: {
      icon: "from-amber-50 to-orange-50 text-amber-700 ring-amber-100",
      button: "from-amber-600 to-orange-600 shadow-amber-100",
      glow: "bg-amber-200/40",
    },
  };

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_28px_85px_rgba(15,23,42,0.14)]">
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full ${tones[tone].glow} blur-3xl transition group-hover:scale-125`}
      />
      <div className="pointer-events-none absolute bottom-5 right-6 text-5xl opacity-10 transition group-hover:opacity-20">
        {icon}
      </div>

      <div className="relative">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-inner ring-1 ${tones[tone].icon}`}
          >
            {icon}
          </div>

          <div>
            <h2 className="text-2xl font-black text-emerald-950">{title}</h2>
            <p className="mt-1 font-bold text-slate-500">{subtitle}</p>
          </div>
        </div>

        <p className="mt-5 min-h-[72px] text-sm font-medium leading-6 text-slate-600">
          {description}
        </p>

        <button
          onClick={onClick}
          disabled={loading}
          className={`mt-5 w-full rounded-2xl bg-gradient-to-r px-5 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 ${tones[tone].button}`}
        >
          {loading ? "กำลัง Export..." : title}
        </button>
      </div>
    </article>
  );
}

function MiniStat({
  label,
  value,
  text,
}: {
  label: string;
  value: number | string;
  text?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p
        className={`mt-1 font-black text-emerald-700 ${
          text ? "text-2xl" : "text-3xl"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-2xl shadow-inner ring-1 ring-emerald-100">
          {icon}
        </div>

        <div>
          <h3 className="font-black text-emerald-950">{title}</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}