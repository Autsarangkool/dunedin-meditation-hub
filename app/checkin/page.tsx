"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function getInitials(name?: string | null) {
  if (!name) return "?"

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatCheckinTime(value?: string | null) {
  if (!value) return "—"

  try {
    return new Intl.DateTimeFormat("en-NZ", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Auckland",
    }).format(new Date(value))
  } catch {
    return "—"
  }
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Today"

  try {
    return new Intl.DateTimeFormat("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Pacific/Auckland",
    }).format(new Date(value))
  } catch {
    return "Today"
  }
}

export default function CheckinPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [search, setSearch] = useState("");
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [latestCheckin, setLatestCheckin] = useState<any>(null);
  const [latestMemberTotalVisits, setLatestMemberTotalVisits] = useState(0);
  const [latestFiveCheckins, setLatestFiveCheckins] = useState<any[]>([]);
  const checkedInCount = todayCheckins?.length ?? 0
  const totalMembers = members?.length ?? 0

  useEffect(() => {
    loadMembers();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadTodayCheckins();
    }
  }, [selectedSessionId]);

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  async function loadMembers() {
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("is_deleted", false)
    .order("full_name");

  setMembers(data || []);
}

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
      setSelectedSessionId(data[0].id);
    }
  }

  async function loadTodayCheckins() {
    if (!selectedSessionId) return;

    const today = getToday();

    const { data, error } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .eq("checkin_date", today)
      .eq("session_id", selectedSessionId)
      .order("checkin_time", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setTodayCheckins(data || []);
    setLatestFiveCheckins((data || []).slice(0, 5));

    if (data && data.length > 0) {
      const latest = data[0];

      const { count } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("member_id", latest.member_id);

      setLatestCheckin({
        ...latest,
        totalVisits: count || 0,
      });
    } else {
      setLatestCheckin(null);
    }
  }

  function alreadyCheckedIn(memberId: string) {
    return todayCheckins.some((item) => item.member_id === memberId);
  }

  function selectedSession() {
    return sessions.find((session) => session.id === selectedSessionId);
  }

  async function handleCheckin(member: any) {
    const session = selectedSession();

    if (!session) {
      alert("กรุณาเลือก Session ก่อน / Please select a session first");
      return;
    }

    if (alreadyCheckedIn(member.id)) {
      alert("สมาชิกคนนี้เช็คอิน Session นี้แล้ว / Already checked in this session");
      return;
    }

    const { data, error } = await supabase
  .from("checkins")
  .upsert(
    {
      member_id: member.id,
      session_id: session.id,
      session_name: session.session_name,
      checkin_date: getToday(),
    },
    {
      onConflict: "member_id,session_id"
    }
  )
  .select("*, members(*), sessions(*)")
  .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { count } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id);

    setLatestCheckin({
      ...data,
      totalVisits: count || 0,
    });

    await loadTodayCheckins();
    setSearch("");
  }

  async function handleDeleteCheckin(checkinId: string) {
    const confirmDelete = window.confirm(
      "ต้องการลบ Check-in นี้หรือไม่? / Delete this check-in?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("id", checkinId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTodayCheckins();
    alert("ลบ Check-in เรียบร้อย / Check-in deleted");
  }

  const filteredMembers = members.filter((member) =>
    `${member.full_name || ""} ${member.nickname || ""} ${member.phone || ""} ${
      member.email || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  useEffect(() => {
  async function loadLatestMemberTotalVisits() {
    const memberId =
      latestCheckin?.member_id || latestCheckin?.members?.id;

    if (!memberId) {
      setLatestMemberTotalVisits(0);
      return;
    }

    const { count, error } = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("member_id", memberId);

    if (error) {
      console.error("LOAD TOTAL VISITS ERROR:", error);
      setLatestMemberTotalVisits(0);
      return;
    }

    setLatestMemberTotalVisits(count ?? 0);
  }

  loadLatestMemberTotalVisits();
}, [latestCheckin]);

  const shouldShowMembers = search.trim() !== "";

  console.log("LATEST CHECKIN DATA =", latestCheckin);

  return (
  <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.13),transparent_28%),radial-gradient(circle_at_top_right,rgba(22,101,52,0.10),transparent_30%),linear-gradient(180deg,#fbf7ef_0%,#f6f1e8_45%,#efe7db_100%)] text-stone-900">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-white via-[#fffaf0] to-[#f1e7d6] shadow-[0_24px_70px_rgba(120,80,30,0.14)]">
  <div className="relative px-6 py-8 sm:px-8">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(22,101,52,0.16),transparent_32%)]" />
<div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-200/30 blur-3xl" />
<div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl" />

    <div className="relative mb-6">
      <a
        href="/"
        className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-white hover:text-stone-950"
      >
        ← กลับหน้าหลัก
      </a>
    </div>

    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-6 inline-flex items-center rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 px-6 py-3 text-xl font-extrabold tracking-wide text-amber-950 shadow-lg sm:px-10 sm:py-4 sm:text-3xl">
  Dunedin Meditation Hub
</div>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Member Check-in
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          ค้นหาสมาชิก เช็คชื่อ และต้อนรับผู้เข้าร่วมปฏิบัติธรรมอย่างเรียบง่ายและสงบ
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white/80 px-5 py-4 text-right shadow-sm backdrop-blur">
          <p className="text-sm font-medium text-stone-500">Session ปัจจุบัน</p>
          <p className="mt-1 max-w-[220px] truncate text-xl font-semibold text-stone-950">
            {selectedSession()?.session_name || "—"}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {selectedSession()?.session_number || "—"} · {selectedSession()?.event_date || ""}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white/80 px-5 py-4 text-right shadow-sm backdrop-blur">
          <p className="text-sm font-medium text-stone-500">Checked in today</p>
          <p className="mt-1 text-3xl font-semibold text-stone-950">
            {checkedInCount}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            from {totalMembers} members
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-amber-100 bg-white p-6 shadow-[0_18px_50px_rgba(120,80,30,0.10)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400" />
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
        Session
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
        เลือกรอบปฏิบัติธรรม
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-500">
        เลือก session ที่ต้องการเช็คชื่อผู้เข้าร่วมในวันนี้
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
  <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
    พร้อมใช้งาน
  </div>

  <a
    href="/sessions"
    className="inline-flex items-center rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
  >
    + สร้างรุ่น
  </a>
</div>
  </div>

  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">
        Select Session
      </label>

      <div className="relative">
  <button
    type="button"
    onClick={() => setSessionDropdownOpen((open) => !open)}
    className="flex h-14 w-full items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 text-left text-base font-medium text-stone-900 outline-none transition hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
  >
    <span className="truncate">
      {selectedSession()
        ? `${selectedSession()?.session_name} — ${selectedSession()?.session_number} — ${selectedSession()?.event_date}`
        : "เลือก Session"}
    </span>

    <span className="ml-3 text-stone-400">
      {sessionDropdownOpen ? "⌃" : "⌄"}
    </span>
  </button>

  {sessionDropdownOpen && (
    <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => {
            setSelectedSessionId(session.id);
            setSessionDropdownOpen(false);
          }}
          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-amber-50 ${
            selectedSessionId === session.id
              ? "bg-amber-50 text-amber-800"
              : "text-stone-700"
          }`}
        >
          <div className="font-semibold text-stone-950">
            {session.session_name}
          </div>

          <div className="mt-1 text-xs text-stone-500">
            {session.session_number} — {session.event_date}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
    </div>

    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-500">Current selection</p>

      <p className="mt-2 truncate text-lg font-semibold text-stone-950">
        {selectedSession()?.session_name || "—"}
      </p>

      <p className="mt-1 text-sm text-stone-500">
        {selectedSession()?.session_number || "—"}
      </p>

      <p className="mt-1 text-sm text-stone-500">
        {selectedSession()?.event_date || "—"}
      </p>
    </div>
  </div>
</section>

      <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-orange-300" />
        <div className="mb-5">
  <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
    Member Check-in
  </p>

  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
    🔍 ค้นหาสมาชิกเพื่อเช็คอิน
  </h2>

  <p className="mt-2 text-base leading-7 text-stone-500">
    พิมพ์ชื่อ ชื่อเล่น หรือเบอร์โทร แล้วกด Check-in ได้ทันที
  </p>
</div>

        <input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="พิมพ์ชื่อ ชื่อเล่น หรือเบอร์โทร..."
  className="h-16 w-full rounded-3xl border border-amber-100 bg-white/90 px-5 text-lg font-medium text-stone-900 shadow-inner outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
/>

        {search.trim() !== "" && (
          <div className="mt-6 max-h-[520px] space-y-4 overflow-y-auto rounded-3xl border border-stone-200 bg-stone-50 p-4">
            {filteredMembers.slice(0, 10).map((member) => {
              const checked = alreadyCheckedIn(member.id);

              return (
                <div
  key={member.id}
 className="flex flex-col gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
>
                  <div className="flex items-center gap-4">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-base font-semibold text-white">
                        {getInitials(member.full_name)}
                      </div>
                    )}

                    <div>
                      <p className="truncate text-lg font-semibold text-stone-950">
  {member.full_name}
</p>
<p className="truncate text-sm text-stone-500">
  {member.nickname || member.phone || "Member profile"}
</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckin(member)}
                    disabled={checked || !selectedSessionId}
                    className={
  checked || !selectedSessionId
  ? "min-h-[52px] min-w-[132px] rounded-2xl bg-stone-200 px-7 py-3 text-base font-semibold text-stone-500"
  : "min-h-[52px] min-w-[132px] rounded-2xl bg-stone-950 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-stone-800"
    
}
                  >
                    {checked ? "Checked in" : "Check-in"}
                  </button>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                ไม่พบสมาชิกที่ค้นหา
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-[#4b5f4a]">
          🎉 เช็คอินล่าสุด / Latest Check-in
        </h2>

        {latestCheckin ? (
          <div className="mt-5 flex flex-col items-center rounded-[2rem] border border-green-200 bg-green-50 p-8 text-center shadow-lg">
            <div className="mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-green-300 bg-white">
              {latestCheckin.members?.profile_photo_url ? (
                <img
                  src={latestCheckin.members.profile_photo_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl">
                  🙏
                </div>
              )}
            </div>

            <h3 className="text-4xl font-black text-slate-900">
              {latestCheckin.members?.full_name || "-"}
            </h3>

            <p className="mt-1 text-2xl text-gray-600">
              {latestCheckin.members?.nickname || ""}
            </p>

            <p className="mt-5 text-3xl font-black text-green-700">
             Check-in complete ✅
            </p>

            <p className="mt-3 text-gray-600">
              {latestCheckin.checkin_time
                ? new Date(latestCheckin.checkin_time).toLocaleTimeString()
                : ""}
            </p>

            <div className="mt-6 inline-flex min-w-[190px] flex-col items-center rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-white px-10 py-6 shadow-[0_18px_40px_rgba(22,101,52,0.16)]">
  <span className="text-6xl font-black leading-none tracking-tight text-emerald-700">
    {latestMemberTotalVisits}
  </span>

  <span className="mt-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-800">
    visits total
  </span>
</div>

          </div>
        ) : (
          <div className="mt-5 rounded-[2rem] border bg-white p-8 text-center shadow-sm">
            <div className="text-7xl animate-pulse">🙏</div>
            <p className="mt-4 text-2xl font-black text-[#4b5f4a]">
              Waiting for Check-in
            </p>
            <p className="mt-2 text-gray-500">
              เมื่อเช็คอินสำเร็จ สมาชิกคนล่าสุดจะแสดงตรงนี้
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
        Attendance
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
        เช็คอินล่าสุด 5 คน
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-500">
        รายชื่อผู้เข้าร่วมที่เช็คอินล่าสุดใน Session นี้
      </p>
    </div>

    <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
      {checkedInCount} checked in
    </div>
  </div>

  {latestFiveCheckins.length > 0 ? (
    <div className="space-y-3">
      {latestFiveCheckins.map((item) => {
        const memberName = item.members?.full_name || "Member"
        const memberDetail = item.members?.nickname || "Checked in"

        return (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-amber-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              {item.members?.profile_photo_url ? (
                <img
                  src={item.members.profile_photo_url}
                  alt={memberName}
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white">
                  {getInitials(memberName)}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-950">
                  {memberName}
                </p>

                <p className="truncate text-sm text-stone-500">
                  {memberDetail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Present
              </span>

              <p className="text-sm text-stone-500">
                {formatCheckinTime(item.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
        🙏
      </div>

      <p className="mt-4 font-semibold text-stone-900">
        ยังไม่มีผู้ Check-in
      </p>

      <p className="mt-2 text-sm leading-6 text-stone-500">
        เมื่อสมาชิกเช็คอินแล้ว รายชื่อจะแสดงที่นี่ทันที
      </p>
    </div>
  )}
</section>
    </div>
  </main>
);
}