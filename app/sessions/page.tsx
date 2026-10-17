"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [meditationLeader, setMeditationLeader] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [meditationLeader2, setMeditationLeader2] = useState("");
  const [selectedLeaderId2, setSelectedLeaderId2] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);

    const [
      { data: sessionData, error: sessionError },
      { data: staffData, error: staffError },
    ] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .order("event_date", { ascending: false }),
      supabase
        .from("staff")
        .select("id, nickname, full_name")
        .order("nickname"),
    ]);

    setLoading(false);

    if (sessionError) {
      alert(sessionError.message);
      return;
    }

    if (staffError) {
      alert(staffError.message);
      return;
    }

    setSessions(sessionData || []);
    setStaffs(staffData || []);
  }

  function resetForm() {
    setSessionName("");
    setSessionNumber("");
    setEventDate("");
    setMeditationLeader("");
    setSelectedLeaderId("");
    setMeditationLeader2("");
    setSelectedLeaderId2("");
    setEditingId(null);
  }

  function generateNextSessionNumber() {
    const numbers = sessions
      .map((session) => session.session_number)
      .filter(Boolean)
      .map((number) => Number(String(number).replace(/^R/i, "")))
      .filter((number) => !Number.isNaN(number));

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

    return `R${String(next).padStart(3, "0")}`;
  }

  async function saveSession() {
    if (!sessionName.trim() || !eventDate) {
      alert("กรุณากรอกชื่อรุ่นและวันที่ / Please enter a session name and date");
      return;
    }

    if (
      selectedLeaderId &&
      selectedLeaderId2 &&
      selectedLeaderId === selectedLeaderId2
    ) {
      alert("กรุณาเลือกผู้นำนั่งสมาธิคนละคน");
      return;
    }

    const finalSessionNumber =
      sessionNumber.trim() || generateNextSessionNumber();

    setSaving(true);

    const payload = {
      session_name: sessionName.trim(),
      session_number: finalSessionNumber,
      event_date: eventDate,
      meditation_leader: meditationLeader || null,
      meditation_leader_id: selectedLeaderId || null,
      meditation_leader_2: meditationLeader2 || null,
      meditation_leader_2_id: selectedLeaderId2 || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("sessions")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }

      setSessions((previous) =>
        previous
          .map((session) => (session.id === editingId ? data : session))
          .sort((a, b) =>
            String(b.event_date || "").localeCompare(
              String(a.event_date || "")
            )
          )
      );
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .insert(payload)
        .select()
        .single();

      setSaving(false);

      if (error) {
        alert(error.message);
        return;
      }

      setSessions((previous) =>
        [data, ...previous].sort((a, b) =>
          String(b.event_date || "").localeCompare(
            String(a.event_date || "")
          )
        )
      );
    }

    resetForm();
  }

  function editSession(session: any) {
    setEditingId(session.id);
    setSessionName(session.session_name || "");
    setSessionNumber(session.session_number || "");
    setEventDate(session.event_date || "");
    setMeditationLeader(session.meditation_leader || "");
    setSelectedLeaderId(session.meditation_leader_id || "");
    setMeditationLeader2(session.meditation_leader_2 || "");
    setSelectedLeaderId2(session.meditation_leader_2_id || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteSession(id: string) {
    const confirmText = window.prompt(
      "คุณจะลบรุ่นนี้จริง ๆ ใช่ไหม?\n\nถ้าต้องการลบจริง ให้พิมพ์คำว่า DELETE"
    );

    if (confirmText !== "DELETE") {
      if (confirmText !== null) {
        alert("ยกเลิกการลบรุ่น / Session deletion cancelled");
      }
      return;
    }

    setDeletingId(id);

    const { data, error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .select();

    setDeletingId("");

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert(
        "ลบไม่สำเร็จ: ไม่พบสิทธิ์ลบ หรือข้อมูลไม่ได้ถูกลบจาก Supabase"
      );
      return;
    }

    setSessions((previous) =>
      previous.filter((session) => session.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  const nextSessionNumber = useMemo(
    () => generateNextSessionNumber(),
    [sessions]
  );

  const latestSession = sessions[0];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-7">
      <SessionsBackground />

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <header className="relative overflow-hidden rounded-[2.4rem] border border-sky-100/90 bg-white/82 p-5 shadow-[0_30px_95px_rgba(56,189,248,0.16)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.75),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(167,243,208,0.35),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,249,255,0.80))]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[390px] lg:block xl:w-[470px]">
            <SessionsWinterIllustration />
          </div>

          <div className="relative">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-400 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </Link>

            <div className="mt-8 max-w-3xl lg:max-w-[65%]">
              <p className="inline-flex rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600 shadow-sm backdrop-blur">
                ❄️ Session Management
              </p>

              <h1 className="winter-title mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                จัดการรุ่น
              </h1>

              <p className="mt-2 text-xl font-black text-sky-700">
                Session Management
              </p>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                สร้าง แก้ไข และจัดการรอบปฏิบัติธรรมอย่างเป็นระเบียบ
                พร้อมเลือกผู้นำนั่งสมาธิจากรายชื่อเจ้าหน้าที่
              </p>
            </div>

            <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
              <MiniStat
                label="รุ่นทั้งหมด"
                value={sessions.length}
                icon="📅"
              />
              <MiniStat
                label="รหัสถัดไป"
                value={editingId ? sessionNumber || "-" : nextSessionNumber}
                icon="🏷️"
              />
            </div>
          </div>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 p-5 shadow-[0_24px_78px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-5 right-7 text-5xl opacity-15">
            ❄️
          </div>

          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">
                  {editingId ? "Edit Session" : "Create Session"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingId ? "แก้ไขรุ่น" : "สร้างรุ่นใหม่"}
                </h2>
              </div>

              {editingId && (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                  ✏️ กำลังแก้ไข
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <FormField label="ชื่อรุ่น / Session Name">
                <FormInput
                  value={sessionName}
                  onChange={setSessionName}
                  placeholder="เช่น Meditation Class 24"
                />
              </FormField>

              <FormField label="รหัสรุ่น / Session Number">
                <FormInput
                  value={sessionNumber}
                  onChange={setSessionNumber}
                  placeholder={`เว้นว่างเพื่อใช้ ${nextSessionNumber}`}
                />
              </FormField>

              <FormField label="วันที่ / Event Date">
                <FormInput
                  type="date"
                  value={eventDate}
                  onChange={setEventDate}
                />
              </FormField>

              <div className="grid gap-4 md:col-span-3 md:grid-cols-2">
                <FormField label="ผู้นำนั่งสมาธิคนที่ 1 / Meditation Leader 1">
                  <select
                    value={selectedLeaderId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSelectedLeaderId(id);

                      const leader = staffs.find((staff) => staff.id === id);

                      setMeditationLeader(
                        leader
                          ? `${leader.full_name || "-"}${
                              leader.nickname ? ` (${leader.nickname})` : ""
                            }`
                          : ""
                      );
                    }}
                    className="h-14 w-full rounded-2xl border border-sky-100 bg-white/88 px-4 font-semibold text-slate-700 outline-none shadow-sm transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">เลือกผู้นำนั่งสมาธิคนที่ 1</option>

                    {staffs.map((staff) => (
                      <option
                        key={staff.id}
                        value={staff.id}
                        disabled={staff.id === selectedLeaderId2}
                      >
                        {staff.full_name || "-"}
                        {staff.nickname ? ` (${staff.nickname})` : ""}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="ผู้นำนั่งสมาธิคนที่ 2 / Meditation Leader 2 (ไม่บังคับ)">
                  <select
                    value={selectedLeaderId2}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSelectedLeaderId2(id);

                      const leader = staffs.find((staff) => staff.id === id);

                      setMeditationLeader2(
                        leader
                          ? `${leader.full_name || "-"}${
                              leader.nickname ? ` (${leader.nickname})` : ""
                            }`
                          : ""
                      );
                    }}
                    className="h-14 w-full rounded-2xl border border-sky-100 bg-white/88 px-4 font-semibold text-slate-700 outline-none shadow-sm transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">เลือกผู้นำคนที่ 2 (ไม่บังคับ)</option>

                    {staffs.map((staff) => (
                      <option
                        key={staff.id}
                        value={staff.id}
                        disabled={staff.id === selectedLeaderId}
                      >
                        {staff.full_name || "-"}
                        {staff.nickname ? ` (${staff.nickname})` : ""}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveSession}
                disabled={saving}
                className="winter-button px-7"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingId
                    ? "บันทึกการแก้ไข"
                    : "+ สร้างรุ่นใหม่"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 font-black text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">
                ❄️ All Sessions
              </p>

              <h2 className="winter-title mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                รายการรุ่นทั้งหมด
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                รายการรอบปฏิบัติธรรมทั้งหมด เรียงจากวันที่ล่าสุด
              </p>
            </div>

            {latestSession && (
              <div className="rounded-[1.4rem] border border-sky-100 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="font-bold text-slate-500">รุ่นล่าสุด</p>
                <p className="font-black text-sky-800">
                  {latestSession.session_name || "-"}
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-sky-100 bg-white/75 px-6 py-14 text-center shadow-lg backdrop-blur-xl">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
              <p className="mt-4 font-bold text-slate-500">
                Loading sessions...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isEditing={editingId === session.id}
                  deleting={deletingId === session.id}
                  onEdit={() => editSession(session)}
                  onDelete={() => deleteSession(session.id)}
                />
              ))}

              {sessions.length === 0 && (
                <div className="rounded-[2rem] border border-dashed border-sky-200 bg-white/72 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
                  <div className="mx-auto w-44">
                    <EmptySessionIllustration />
                  </div>
                  <h3 className="winter-title mt-4 text-2xl font-black">
                    ยังไม่มีรุ่น
                  </h3>
                  <p className="mt-2 font-medium text-slate-500">
                    เริ่มสร้างรุ่นแรกจากแบบฟอร์มด้านบนได้เลย
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SessionsBackground() {
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

        <div className="absolute right-12 top-28 text-6xl opacity-20">❄️</div>
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

function SessionsWinterIllustration() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="h-auto w-full drop-shadow-[0_20px_28px_rgba(56,189,248,0.16)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sessionSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9f8ff" />
          <stop offset="58%" stopColor="#c8edff" />
          <stop offset="100%" stopColor="#edfff8" />
        </linearGradient>
        <linearGradient id="sessionSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#def3ff" />
        </linearGradient>
      </defs>

      <path
        d="M20 215 112 112l65 65 70-105 100 113 61-59 92 80v94H20Z"
        fill="url(#sessionSky)"
      />
      <path
        d="M20 235c86-37 154-31 221 3 70 36 144 36 259-4v66H20Z"
        fill="url(#sessionSnow)"
      />

      <g transform="translate(295 140)">
        <rect x="18" y="52" width="108" height="72" rx="9" fill="#d68c58" />
        <path d="M6 61 72 12l67 49Z" fill="#925a46" />
        <path d="M6 61 72 12l67 49-9 5-58-43-58 43Z" fill="#ffffff" />
        <rect x="60" y="82" width="25" height="42" rx="3" fill="#6c4234" />
        <rect x="31" y="76" width="19" height="19" rx="3" fill="#ffe6a4" />
        <rect x="98" y="76" width="19" height="19" rx="3" fill="#ffe6a4" />
      </g>

      <g transform="translate(408 164)">
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

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-14 w-full rounded-2xl border border-sky-100 bg-white/88 px-4 font-semibold text-slate-700 outline-none shadow-sm transition placeholder:font-medium placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    />
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
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
          <p className="mt-0.5 text-2xl font-black text-sky-700">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isEditing,
  deleting,
  onEdit,
  onDelete,
}: {
  session: any;
  isEditing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[2rem] border bg-white/80 p-5 shadow-[0_20px_62px_rgba(56,189,248,0.11)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_28px_82px_rgba(56,189,248,0.18)] ${
        isEditing
          ? "border-amber-300 ring-4 ring-amber-100"
          : "border-sky-100/85"
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-emerald-200/28 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-[0.08] transition group-hover:opacity-20">
        ❄️
      </div>

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              {session.session_name || "-"}
            </h3>

            {isEditing && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Editing
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 font-black text-sky-700">
              🏷️ {session.session_number || "-"}
            </span>

            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-black text-emerald-700">
              📅 {session.event_date || "-"}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-600">
            🧘 ผู้นำนั่งสมาธิ:{" "}
            <span className="font-black text-sky-700">
              {[
                session.meditation_leader,
                session.meditation_leader_2,
              ]
                .filter(Boolean)
                .join(" และ ") || "-"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/checkin?sessionId=${session.id}&backdate=1`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
          >
            เช็คอินย้อนหลัง
          </Link>

          <Link
            href={`/sessions/${session.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-sky-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
          >
            View
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-amber-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-rose-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptySessionIllustration() {
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
