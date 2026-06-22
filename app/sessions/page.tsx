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
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, nickname, full_name")
      .order("nickname");

    if (staffError) {
      alert(staffError.message);
      return;
    }

    setStaffs(staffData || []);
    setSessions(data || []);
  }

  function resetForm() {
    setSessionName("");
    setSessionNumber("");
    setEventDate("");
    setMeditationLeader("");
    setSelectedLeaderId("");
    setEditingId(null);
  }

  function generateNextSessionNumber() {
    const numbers = sessions
      .map((s) => s.session_number)
      .filter(Boolean)
      .map((num) => Number(String(num).replace("R", "")))
      .filter((num) => !isNaN(num));

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `R${String(next).padStart(3, "0")}`;
  }

  async function saveSession() {
    if (!sessionName || !eventDate) {
      alert("กรุณากรอกชื่อรุ่นและวันที่");
      return;
    }

    const finalSessionNumber =
      sessionNumber.trim() || generateNextSessionNumber();

    if (editingId) {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          session_name: sessionName,
          session_number: finalSessionNumber,
          event_date: eventDate,
          meditation_leader: meditationLeader,
          meditation_leader_id: selectedLeaderId || null,
        })
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      setSessions((prev) =>
        prev.map((session) => (session.id === editingId ? data : session))
      );
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          session_name: sessionName,
          session_number: finalSessionNumber,
          event_date: eventDate,
          meditation_leader: meditationLeader,
          meditation_leader_id: selectedLeaderId || null,
        })
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      setSessions((prev) =>
        [data, ...prev].sort((a, b) =>
          String(b.event_date || "").localeCompare(String(a.event_date || ""))
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
  }

  async function deleteSession(id: string) {
    const confirmText = prompt(
  "คุณจะลบรุ่นนี้จริง ๆ ใช่มั้ย?\n\nถ้าต้องการลบจริง ให้พิมพ์คำว่า DELETE"
);

if (confirmText !== "DELETE") {
  alert("ยกเลิกการลบรุ่น");
  return;
}

    console.log("DELETE SESSION ID =", id);

    const { data, error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .select();

    console.log("DELETE RESULT =", { data, error });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("ลบไม่สำเร็จ: ไม่พบสิทธิ์ลบ หรือข้อมูลไม่ได้ถูกลบจาก Supabase");
      return;
    }

    setSessions((prev) => prev.filter((session) => session.id !== id));

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
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <SessionsBackground />

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

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </Link>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Session Management
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  จัดการรุ่น / Session Management
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  สร้าง แก้ไข และจัดการรอบปฏิบัติธรรมอย่างเป็นระเบียบ
                  พร้อมบรรยากาศที่สบายตาและพาสบายใจ
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-3">
                <MiniStat label="รุ่นทั้งหมด" value={sessions.length} />
                <MiniStat
                  label="รหัสถัดไป"
                  value={editingId ? sessionNumber || "-" : nextSessionNumber}
                  text
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-20">
            🌱
          </div>

          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                  {editingId ? "Edit Session" : "Create Session"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-emerald-950">
                  {editingId ? "แก้ไขรุ่น" : "สร้างรุ่นใหม่"}
                </h2>
              </div>

              {editingId && (
                <div className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                  กำลังแก้ไข
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <FormInput
                value={sessionName}
                onChange={setSessionName}
                placeholder="ชื่อรุ่น เช่น ครั้งที่ 24"
              />

              <FormInput
                value={sessionNumber}
                onChange={setSessionNumber}
                placeholder={`รหัส เช่น ${nextSessionNumber}`}
              />

              <FormInput
                type="date"
                value={eventDate}
                onChange={setEventDate}
              />

              <select
                value={selectedLeaderId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedLeaderId(id);

                  const leader = staffs.find((staff) => staff.id === id);

                  setMeditationLeader(
                    leader ? `${leader.full_name} (${leader.nickname})` : ""
                  );
                }}
                className="h-14 rounded-2xl border border-emerald-100 bg-white/85 px-4 font-semibold text-slate-700 outline-none shadow-sm backdrop-blur focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
              >
                <option value="">เลือกผู้นำนั่งสมาธิ</option>

                {staffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.nickname})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={saveSession}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {editingId ? "บันทึกการแก้ไข" : "+ สร้างรุ่นใหม่"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
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
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                🌿 All Sessions
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
                รายการรุ่นทั้งหมด
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                รายการรอบปฏิบัติธรรมทั้งหมด เรียงจากวันที่ล่าสุด
              </p>
            </div>

            {latestSession && (
              <div className="rounded-2xl border border-white/75 bg-white/75 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="font-bold text-slate-500">ล่าสุด</p>
                <p className="font-black text-emerald-900">
                  {latestSession.session_name || "-"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isEditing={editingId === session.id}
                onEdit={() => editSession(session)}
                onDelete={() => deleteSession(session.id)}
              />
            ))}

            {sessions.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
                <div className="text-5xl">🌿</div>
                <h3 className="mt-4 text-2xl font-black text-emerald-900">
                  ยังไม่มีรุ่น
                </h3>
                <p className="mt-2 text-slate-500">
                  เริ่มสร้างรุ่นแรกจากแบบฟอร์มด้านบนได้เลย
                </p>
              </div>
            )}
          </div>
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
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(135deg,#f8fbf6_0%,#fff8ec_48%,#eef9f4_100%)]"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute left-[18%] top-[-120px] h-[460px] w-[560px] rounded-full bg-sky-200/28 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-amber-200/28 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[22%] h-[520px] w-[520px] rounded-full bg-lime-200/25 blur-3xl" />

        <div className="absolute right-12 top-28 text-6xl opacity-25">🕊️</div>
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-20">🌿</div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-20">🌸</div>
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
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-14 rounded-2xl border border-emerald-100 bg-white/85 px-4 font-semibold text-slate-700 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
    />
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

function SessionCard({
  session,
  isEditing,
  onEdit,
  onDelete,
}: {
  session: any;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[2rem] border bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/92 hover:shadow-[0_28px_85px_rgba(15,23,42,0.16)] ${
        isEditing ? "border-amber-300 ring-4 ring-amber-100" : "border-white/80"
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-sky-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-10 transition group-hover:opacity-20">
        🌿
      </div>

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black tracking-tight text-emerald-950">
              {session.session_name || "-"}
            </h3>

            {isEditing && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Editing
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
              {session.session_number || "-"}
            </span>

            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 font-bold text-sky-700">
              {session.event_date || "-"}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-emerald-700">
            ผู้นำนั่งสมาธิ: {session.meditation_leader || "-"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
  <Link
    href={`/checkin?sessionId=${session.id}&backdate=1`}
    className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg"
  >
    เช็คอินย้อนหลัง
  </Link>

  <Link
    href={`/sessions/${session.id}`}
    className="rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg"
  >
    View
  </Link>

  <button
    type="button"
    onClick={onEdit}
    className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-100 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg"
  >
    Edit
  </button>

  <button
    type="button"
    onClick={onDelete}
    className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
  >
    Delete
  </button>
</div>
      </div>
    </article>
  );
}