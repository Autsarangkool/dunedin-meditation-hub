"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SessionDetail = {
  id: string;
  session_name: string | null;
  session_number: string | null;
  event_date: string | null;
  meditation_leader: string | null;
};

type Member = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  profile_photo_url: string | null;
  photo_consent?: string | null;
};

type Checkin = {
  id: string;
  member_id: string | null;
  session_id: string | null;
  session_name: string | null;
  checkin_date: string | null;
  checkin_time: string | null;
  members: Member | null;
};

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  async function loadSessionData() {
    if (!sessionId) {
      setLoadError("ไม่พบรหัส Session");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    const [
      { data: sessionData, error: sessionError },
      { data: checkinData, error: checkinError },
    ] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single(),
      supabase
        .from("checkins")
        .select("*, members(*)")
        .eq("session_id", sessionId)
        .order("checkin_time", { ascending: true }),
    ]);

    setLoading(false);

    if (sessionError) {
      setLoadError(sessionError.message);
      return;
    }

    if (checkinError) {
      setLoadError(checkinError.message);
      return;
    }

    setSession(sessionData);
    setCheckins(checkinData || []);
  }

  async function handleDeleteCheckin(checkin: Checkin) {
    if (deletingId) return;

    const memberName =
      checkin.members?.full_name ||
      checkin.members?.nickname ||
      "สมาชิกคนนี้";

    const confirmed = window.confirm(
      `ต้องการลบ Check-in ของ ${memberName} ใช่ไหม?`
    );

    if (!confirmed) return;

    setDeletingId(checkin.id);

    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("id", checkin.id);

    setDeletingId("");

    if (error) {
      alert(error.message);
      return;
    }

    setCheckins((previous) =>
      previous.filter((item) => item.id !== checkin.id)
    );
  }

  const filteredCheckins = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return checkins;

    return checkins.filter((checkin) => {
      const member = checkin.members;

      const searchableText = [
        member?.full_name,
        member?.nickname,
        member?.phone,
        member?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [checkins, search]);

  function exportCSV() {
    if (!session || checkins.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const headers = [
      "No.",
      "Full Name",
      "Nickname",
      "Phone",
      "Email",
      "Check-in Date",
      "Check-in Time",
      "Session",
      "Session Number",
    ];

    const rows = checkins.map((checkin, index) => [
      index + 1,
      checkin.members?.full_name || "",
      checkin.members?.nickname || "",
      checkin.members?.phone || "",
      checkin.members?.email || "",
      checkin.checkin_date || session.event_date || "",
      formatCheckinTime(checkin.checkin_time),
      session.session_name || "",
      session.session_number || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sessionLabel =
      session.session_number || session.session_name || "session";

    link.href = url;
    link.download = `attendance-${sanitizeFileName(sessionLabel)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
        <SessionDetailBackground />

        <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-sky-100 bg-white/82 px-6 py-14 text-center shadow-[0_28px_90px_rgba(56,189,248,0.16)] backdrop-blur-2xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
          <p className="mt-4 font-black text-slate-600">
            กำลังโหลดข้อมูล Session...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !session) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
        <SessionDetailBackground />

        <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-sky-100 bg-white/82 px-6 py-12 text-center shadow-[0_28px_90px_rgba(56,189,248,0.16)] backdrop-blur-2xl">
          <div className="mx-auto w-44">
            <EmptyAttendanceIllustration />
          </div>

          <h1 className="winter-title mt-5 text-3xl font-black">
            ไม่พบข้อมูล Session
          </h1>

          <p className="mt-3 font-medium text-slate-500">
            {loadError || "Session record not found"}
          </p>

          <Link
            href="/sessions"
            className="winter-button mt-7 inline-flex px-6"
          >
            ← กลับหน้าจัดการรุ่น
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-7">
      <SessionDetailBackground />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <header className="relative overflow-hidden rounded-[2.4rem] border border-sky-100/90 bg-white/82 p-5 shadow-[0_30px_95px_rgba(56,189,248,0.16)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.76),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(167,243,208,0.36),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,249,255,0.80))]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[390px] lg:block xl:w-[470px]">
            <SessionDetailWinterIllustration />
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sessions"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl"
              >
                ← กลับหน้าจัดการรุ่น
              </Link>

              <Link
                href={`/checkin?sessionId=${session.id}&backdate=1`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl"
              >
                ✓ เพิ่ม Check-in
              </Link>

              <button
                type="button"
                onClick={exportCSV}
                disabled={checkins.length === 0}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                ⬇ Export CSV
              </button>
            </div>

            <div className="mt-8 max-w-3xl lg:max-w-[65%]">
              <p className="inline-flex rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600 shadow-sm backdrop-blur">
                ❄️ Session Attendance
              </p>

              <h1 className="winter-title mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {session.session_name || "Session"}
              </h1>

              <p className="mt-2 text-xl font-black text-sky-700">
                ประวัติการเช็กอิน
              </p>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                รายชื่อสมาชิกที่เข้าร่วม Session นี้ พร้อมวันและเวลาเช็กอิน
              </p>
            </div>

            <div className="mt-7 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat
                icon="🏷️"
                label="รหัสรุ่น"
                value={session.session_number || "-"}
              />
              <MiniStat
                icon="📅"
                label="วันที่"
                value={formatSessionDate(session.event_date)}
              />
              <MiniStat
                icon="🧘"
                label="ผู้นำสมาธิ"
                value={session.meditation_leader || "-"}
              />
              <MiniStat
                icon="👥"
                label="ผู้เข้าร่วม"
                value={checkins.length.toLocaleString()}
              />
            </div>
          </div>
        </header>

        <section className="relative mt-7 overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 p-5 shadow-[0_24px_78px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">
                  Attendance List
                </p>

                <h2 className="winter-title mt-2 text-3xl font-black">
                  รายชื่อผู้เข้าร่วม
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  แสดง {filteredCheckins.length.toLocaleString()} จาก{" "}
                  {checkins.length.toLocaleString()} รายการ
                </p>
              </div>

              <div className="relative w-full max-w-xl overflow-hidden rounded-[1.4rem] border border-sky-200/80 bg-white/90 p-2 shadow-sm focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-emerald-100 text-lg">
                    🔎
                  </div>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล..."
                    className="h-12 min-w-0 flex-1 bg-transparent px-1 font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredCheckins.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-sky-100 bg-white/70">
                <div className="hidden grid-cols-[70px_minmax(240px,1.5fr)_minmax(150px,1fr)_minmax(170px,1fr)_130px_110px] gap-4 border-b border-sky-100 bg-sky-50/80 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-sky-700 lg:grid">
                  <div>No.</div>
                  <div>Member</div>
                  <div>Phone</div>
                  <div>Email</div>
                  <div>Time</div>
                  <div>Action</div>
                </div>

                <div className="divide-y divide-sky-100">
                  {filteredCheckins.map((checkin, index) => (
                    <CheckinRow
                      key={checkin.id}
                      checkin={checkin}
                      index={index}
                      deleting={deletingId === checkin.id}
                      onDelete={() => handleDeleteCheckin(checkin)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-7 rounded-[1.7rem] border border-dashed border-sky-200 bg-white/65 px-6 py-12 text-center">
                <div className="mx-auto w-44">
                  <EmptyAttendanceIllustration />
                </div>

                <h3 className="winter-title mt-4 text-2xl font-black">
                  {checkins.length === 0
                    ? "ยังไม่มีผู้เช็กอิน"
                    : "ไม่พบรายชื่อที่ค้นหา"}
                </h3>

                <p className="mt-2 font-medium text-slate-500">
                  {checkins.length === 0
                    ? "กด “เพิ่ม Check-in” เพื่อเพิ่มผู้เข้าร่วม Session นี้"
                    : "ลองเปลี่ยนคำค้นหา หรือล้างช่องค้นหา"}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckinRow({
  checkin,
  index,
  deleting,
  onDelete,
}: {
  checkin: Checkin;
  index: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  const member = checkin.members;
  const displayName =
    member?.full_name || member?.nickname || "Unknown member";

  return (
    <article className="grid gap-4 px-5 py-5 transition hover:bg-sky-50/45 lg:grid-cols-[70px_minmax(240px,1.5fr)_minmax(150px,1fr)_minmax(170px,1fr)_130px_110px] lg:items-center">
      <div className="hidden text-sm font-black text-sky-500 lg:block">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="flex min-w-0 items-center gap-4">
        <MemberAvatar member={member} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-600 lg:hidden">
              #{index + 1}
            </span>

            <h3 className="truncate font-black text-slate-950">
              {displayName}
            </h3>
          </div>

          <p className="mt-1 truncate text-sm font-semibold text-sky-600">
            {member?.nickname || "Member"}
          </p>

          <div className="mt-2.5">
            <PhotoConsentStatus value={member?.photo_consent} />
          </div>
        </div>
      </div>

      <InfoValue icon="📞" value={member?.phone || "-"} />
      <InfoValue icon="✉️" value={member?.email || "-"} />

      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:hidden">
          Check-in Time
        </p>

        <p className="mt-1 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700 lg:mt-0">
          🕒 {formatCheckinTime(checkin.checkin_time)}
        </p>
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-rose-100 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "ลบ"}
      </button>
    </article>
  );
}

function PhotoConsentStatus({
  value,
}: {
  value?: string | null;
}) {
  const allowed = value === "allowed";
  const denied = value === "denied";

  const label = allowed
    ? "อนุญาตให้ถ่ายภาพ"
    : denied
      ? "ไม่อนุญาตให้ถ่ายภาพ"
      : "ยังไม่ระบุการถ่ายภาพ";

  const english = allowed
    ? "Photography permitted"
    : denied
      ? "Please avoid taking photos"
      : "Please ask before taking photos";

  const tone = allowed
    ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-800"
    : denied
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const dot = allowed
    ? "bg-emerald-500"
    : denied
      ? "bg-rose-500"
      : "bg-amber-500";

  return (
    <span
      title={english}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 ${tone}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
      />
      <span className="text-xs font-semibold leading-relaxed">
        {label}
      </span>
    </span>
  );
}

function MemberAvatar({ member }: { member: Member | null }) {
  if (member?.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || "Member"}
        className="h-14 w-14 shrink-0 rounded-full object-cover shadow-sm ring-4 ring-white"
      />
    );
  }

  const initials = getInitials(
    member?.full_name || member?.nickname || "?"
  );

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400 text-sm font-black text-white shadow-sm ring-4 ring-white">
      {initials}
    </div>
  );
}

function InfoValue({
  icon,
  value,
}: {
  icon: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:hidden">
        Contact
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-600 lg:mt-0">
        {icon} {value}
      </p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-sky-100/90 bg-white/78 p-4 shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-100 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 text-xl shadow-inner ring-1 ring-sky-100">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-0.5 truncate text-lg font-black text-sky-700">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionDetailBackground() {
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

function SessionDetailWinterIllustration() {
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

      <g transform="translate(210 181)">
        <rect x="0" y="0" width="82" height="84" rx="14" fill="#ffffff" />
        <circle cx="25" cy="27" r="10" fill="#7dd3fc" />
        <circle cx="57" cy="27" r="10" fill="#6ee7b7" />
        <path
          d="M10 62c3-14 27-14 30 0M42 62c3-14 27-14 30 0"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="m63 8 7 7 14-16"
          fill="none"
          stroke="#10b981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCheckinTime(value?: string | null) {
  if (!value) return "-";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  }).format(date);
}

function formatSessionDate(value?: string | null) {
  if (!value) return "-";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function escapeCSV(value: unknown) {
  const text =
    value === null || value === undefined ? "" : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "session";
}