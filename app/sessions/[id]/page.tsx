"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) loadData();
  }, [sessionId]);

  async function loadData() {
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      alert(sessionError.message);
      setLoading(false);
      return;
    }

    let leaderData = null;

    if (sessionData?.meditation_leader_id) {
      const { data } = await supabase
        .from("staff")
        .select(
          "id, full_name, nickname, role, department, phone, email, profile_photo_url"
        )
        .eq("id", sessionData.meditation_leader_id)
        .single();

      leaderData = data;
    }

    setSession({
      ...sessionData,
      leader: leaderData,
    });

    const { data: checkinData, error: checkinError } = await supabase
      .from("checkins")
      .select("*, members(*)")
      .eq("session_id", sessionId)
      .order("checkin_time", { ascending: true });

    if (checkinError) {
      alert(checkinError.message);
      setLoading(false);
      return;
    }

    console.log("SESSION =", sessionData);
    setCheckins(checkinData || []);
    setLoading(false);
  }

  function escapeCSV(value: any) {
    if (value === null || value === undefined) return "";

    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  }

  function exportCSV() {
    if (!session) {
      alert("ยังไม่พบข้อมูล Session");
      return;
    }

    if (checkins.length === 0) {
      alert("ยังไม่มีรายชื่อผู้เข้าร่วมให้ Export");
      return;
    }

    const headers = [
      "No",
      "Full Name",
      "Nickname",
      "Phone",
      "Email",
      "Session Name",
      "Session Number",
      "Session Date",
      "Check-in Date",
      "Check-in Time",
    ];

    const rows = checkins.map((item, index) => [
      index + 1,
      item.members?.full_name || "",
      item.members?.nickname || "",
      item.members?.phone || "",
      item.members?.email || "",
      session.session_name || item.session_name || "",
      session.session_number || "",
      session.event_date || "",
      item.checkin_date || "",
      item.checkin_time
        ? new Date(item.checkin_time).toLocaleTimeString()
        : "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const fileName = `session-${session.session_number || session.id}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function deleteCheckin(id: string) {
    const ok = confirm("ต้องการลบรายการเช็คอินนี้ใช่ไหม?");
    if (!ok) return;

    console.log("DELETE CHECKIN ID =", id);

    const { data, error } = await supabase
      .from("checkins")
      .delete()
      .eq("id", id)
      .select();

    console.log("DELETE RESULT =", { data, error });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("ลบไม่สำเร็จ: ไม่พบรายการนี้ หรือไม่มีสิทธิ์ลบใน Supabase RLS");
      return;
    }

    await loadData();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <SessionDetailBackground />

      <div className="relative z-10 mx-auto max-w-6xl">
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

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                Session Attendance
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                รายชื่อผู้เข้าร่วม Session
              </h1>

              {session && (
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <InfoPill tone="emerald">
                      {session.session_name || "-"}
                    </InfoPill>

                    <InfoPill tone="sky">
                      {session.session_number || "-"}
                    </InfoPill>

                    <InfoPill tone="amber">
                      {session.event_date || "-"}
                    </InfoPill>
                  </div>

                  <p className="text-sm font-semibold text-emerald-700">
                    ผู้นำนั่งสมาธิ: {session.meditation_leader || "-"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                onClick={exportCSV}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Export CSV
              </button>

              <Link
                href="/sessions"
                className="rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
              >
                ← กลับ
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingCard />
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="pointer-events-none absolute bottom-5 right-8 text-5xl opacity-15">
                  🌱
                </div>

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                      🌿 Attendance Summary
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-emerald-950">
                      ผู้เข้าร่วมทั้งหมด
                    </h2>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      รายชื่อผู้ที่เช็คอินใน session นี้ เรียงตามเวลาเช็คอิน
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-emerald-100 bg-white/80 px-7 py-5 text-center shadow-sm backdrop-blur">
                    <p className="text-sm font-bold text-slate-500">Total</p>
                    <p className="mt-1 text-5xl font-black text-emerald-700">
                      {checkins.length}
                    </p>
                    <p className="text-sm font-bold text-slate-500">คน</p>
                  </div>
                </div>
              </div>

              <LeaderCard session={session} />
            </section>

            <section className="mt-8">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                    🕊️ Checked-in Members
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
                    รายชื่อผู้เช็คอิน
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/75 bg-white/75 px-4 py-3 text-sm shadow-sm backdrop-blur">
                  <p className="font-bold text-slate-500">Session</p>
                  <p className="font-black text-emerald-900">
                    {session?.session_number || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {checkins.map((item, index) => (
                  <AttendeeCard
                    key={item.id}
                    item={item}
                    index={index}
                    onDelete={() => deleteCheckin(item.id)}
                  />
                ))}

                {checkins.length === 0 && <EmptyState />}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SessionDetailBackground() {
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

function InfoPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "emerald" | "sky" | "amber";
}) {
  const classes = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-bold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function LoadingCard() {
  return (
    <div className="mt-8 rounded-[2rem] border border-white/75 bg-white/75 px-6 py-12 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <div className="text-5xl">🙏</div>
      <p className="mt-4 text-xl font-black text-emerald-900">กำลังโหลด...</p>
      <p className="mt-2 text-sm text-slate-500">
        กำลังดึงข้อมูล session และรายชื่อผู้เข้าร่วม
      </p>
    </div>
  );
}

function LeaderCard({ session }: { session: any }) {
  if (!session?.leader) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
            Meditation Leader
          </p>
          <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white/65 px-5 py-8 text-center">
            <div className="text-4xl">🕊️</div>
            <p className="mt-3 font-bold text-slate-500">
              ยังไม่มีข้อมูลผู้นำสมาธิ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 right-5 text-4xl opacity-15">
        🌸
      </div>

      <div className="relative">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
          Meditation Leader
        </p>

        <Link
          href={`/staff/${session.leader.id}`}
          className="mt-5 flex items-center gap-4 rounded-[1.75rem] border border-emerald-100 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
        >
          <Avatar
            src={session.leader.profile_photo_url}
            alt={session.leader.full_name || ""}
            size="lg"
          />

          <div className="min-w-0">
            <p className="truncate text-lg font-black text-emerald-950">
              {session.leader.full_name}
            </p>
            <p className="truncate text-sm font-medium text-slate-500">
              {session.leader.nickname || "-"}
            </p>
            <p className="truncate text-sm font-medium text-slate-500">
              {session.leader.role || "-"}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function AttendeeCard({
  item,
  index,
  onDelete,
}: {
  item: any;
  index: number;
  onDelete: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-[0_20px_65px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/92 hover:shadow-[0_28px_85px_rgba(15,23,42,0.16)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-sky-200/25 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700 shadow-inner">
            {index + 1}
          </div>

          <Avatar
            src={item.members?.profile_photo_url}
            alt={item.members?.full_name || ""}
            size="md"
          />

          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-950">
              {item.members?.full_name || "-"}
            </p>

            <p className="truncate text-sm font-medium text-slate-500">
              {item.members?.nickname || item.members?.phone || "-"}
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              เวลา{" "}
              {item.checkin_time
                ? new Date(item.checkin_time).toLocaleTimeString()
                : "-"}
            </p>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function Avatar({
  src,
  alt,
  size,
}: {
  src?: string | null;
  alt: string;
  size: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16" : "h-14 w-14";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} shrink-0 rounded-full object-cover shadow-md ring-4 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-3xl shadow-inner ring-4 ring-white`}
    >
      🙏
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
      <div className="text-5xl">🌿</div>

      <h3 className="mt-4 text-2xl font-black text-emerald-900">
        ยังไม่มีผู้เช็คอินใน Session นี้
      </h3>

      <p className="mt-2 text-slate-500">
        เมื่อมีสมาชิกเช็คอิน รายชื่อจะแสดงที่นี่โดยอัตโนมัติ
      </p>
    </div>
  );
}