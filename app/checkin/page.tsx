"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function getInitials(name?: string | null) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAucklandToday() {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCheckinDateForSession(session?: any) {
  return session?.event_date || getAucklandToday();
}

function formatCheckinTime(value?: string | null) {
  if (!value) return "—";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-NZ", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Auckland",
    }).format(date);
  } catch {
    return "—";
  }
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Today";

  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return value || "Today";
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
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState("");

  const checkedInCount = todayCheckins?.length ?? 0;
  const totalMembers = members?.length ?? 0;

  useEffect(() => {
    loadMembers();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadTodayCheckins();
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    async function loadLatestMemberTotalVisits() {
      const memberId = latestCheckin?.member_id || latestCheckin?.members?.id;

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

  async function loadMembers() {
    setLoadingMembers(true);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_deleted", false)
      .order("full_name");

    setLoadingMembers(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMembers(data || []);
  }

  async function loadSessions() {
    setLoadingSessions(true);

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    setLoadingSessions(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSessions(data || []);

    if (data && data.length > 0) {
      const urlSessionId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("sessionId")
          : null;

      const urlSessionExists =
        urlSessionId && data.some((session) => session.id === urlSessionId);

      setSelectedSessionId(urlSessionExists ? urlSessionId : data[0].id);
    }
  }

  async function loadTodayCheckins() {
    if (!selectedSessionId) return;

    const session = selectedSession();
    const checkinDate = getCheckinDateForSession(session);

    const { data, error } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .eq("checkin_date", checkinDate)
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

    setSavingMemberId(member.id);

    const { data, error } = await supabase
      .from("checkins")
      .upsert(
        {
          member_id: member.id,
          session_id: session.id,
          session_name: session.session_name,
          checkin_date: getCheckinDateForSession(session),
        },
        {
          onConflict: "member_id,session_id",
        }
      )
      .select("*, members(*), sessions(*)")
      .single();

    setSavingMemberId("");

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

    const { error } = await supabase.from("checkins").delete().eq("id", checkinId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTodayCheckins();
    alert("ลบ Check-in เรียบร้อย / Check-in deleted");
  }

  const currentSession = selectedSession();

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return [];

    return members.filter((member) =>
      `${member.full_name || ""} ${member.nickname || ""} ${member.phone || ""} ${
        member.email || ""
      }`
        .toLowerCase()
        .includes(keyword)
    );
  }, [members, search]);

  const shouldShowMembers = search.trim() !== "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 text-[#14382d] sm:px-6">
      <CheckinBackground />

      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 px-5 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 text-4xl shadow-inner">
                🪷
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">
                  Dunedin Meditation Hub
                </h1>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  A calm mind, a kind heart, a better world.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-emerald-100 bg-white/85 px-5 py-3 text-sm font-bold text-emerald-800 shadow-sm">
                📅 {formatSessionDate(currentSession?.event_date)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Checked in" value={checkedInCount} />
                <MiniStat label="Members" value={totalMembers} />
              </div>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                🏠 Home
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/78 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.62),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(254,240,138,0.26),transparent_34%)]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
            <div className="pointer-events-none absolute right-10 top-20 hidden h-36 w-36 items-center justify-center rounded-full border border-emerald-100 bg-white/50 text-6xl shadow-inner lg:flex">
              👤
            </div>
            <div className="pointer-events-none absolute bottom-10 left-8 text-5xl opacity-20">
              🌿
            </div>

            <div className="relative">
              <div className="mb-8 max-w-3xl">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-emerald-700">
                  🌿 Member Check-In
                </p>

                <h2 className="text-5xl font-black leading-[0.95] tracking-tight text-emerald-950 sm:text-6xl lg:text-7xl">
                  Member Check-In
                </h2>

                <p className="mt-5 text-xl font-bold text-slate-600">
                  ค้นหาสมาชิกเพื่อเช็คอิน
                </p>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500 sm:text-base">
                  ค้นหาชื่อ, ชื่อเล่น, เบอร์โทร หรืออีเมล แล้วกด Check-In ได้ทันที
                </p>
              </div>

              <div className="mb-7 rounded-[2rem] border border-emerald-100 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-2 block text-sm font-black text-slate-600">
                      Select Session
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSessionDropdownOpen((open) => !open)}
                        className="flex h-14 w-full items-center justify-between rounded-2xl border border-emerald-100 bg-white/90 px-4 text-left text-base font-bold text-slate-800 outline-none shadow-sm backdrop-blur transition hover:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      >
                        <span className="truncate">
                          {loadingSessions
                            ? "Loading sessions..."
                            : currentSession
                              ? `${currentSession.session_name} — ${
                                  currentSession.session_number || "-"
                                } — ${currentSession.event_date || "-"}`
                              : "เลือก Session"}
                        </span>

                        <span className="ml-3 text-slate-400">
                          {sessionDropdownOpen ? "⌃" : "⌄"}
                        </span>
                      </button>

                      {sessionDropdownOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-2 shadow-2xl">
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => {
                                setSelectedSessionId(session.id);
                                setSessionDropdownOpen(false);
                              }}
                              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition hover:bg-emerald-50 ${
                                selectedSessionId === session.id
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "text-slate-700"
                              }`}
                            >
                              <div className="font-black text-slate-950">
                                {session.session_name || "Untitled Session"}
                              </div>

                              <div className="mt-1 text-xs font-medium text-slate-500">
                                {session.session_number || "-"} —{" "}
                                {session.event_date || "-"}
                              </div>
                            </button>
                          ))}

                          {sessions.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm font-medium text-slate-500">
                              ยังไม่มี Session
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/sessions"
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-900 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    Manage Sessions
                  </Link>
                </div>
              </div>

              <div className="relative mb-7">
                <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
                  🔎
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, nickname, phone or email..."
                  className="h-16 w-full rounded-3xl border border-emerald-100 bg-white/90 pl-14 pr-5 text-base font-semibold text-slate-800 shadow-[0_12px_35px_rgba(15,23,42,0.08)] outline-none backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-black text-emerald-950">Members</h3>

                <span className="text-sm font-bold text-emerald-700">
                  Select a member to check in
                </span>
              </div>

              {!shouldShowMembers && (
                <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/60 px-6 py-12 text-center shadow-inner backdrop-blur">
                  <div className="text-6xl">🙏</div>

                  <h3 className="mt-4 text-2xl font-black text-emerald-950">
                    Start searching for a member
                  </h3>

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    พิมพ์ชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล เพื่อเริ่มเช็คอิน
                  </p>
                </div>
              )}

              {shouldShowMembers && (
                <div className="max-h-[650px] space-y-3 overflow-y-auto rounded-[2rem] border border-emerald-100 bg-white/55 p-3 shadow-inner backdrop-blur">
                  {loadingMembers && (
                    <div className="rounded-[2rem] bg-white/70 px-6 py-10 text-center text-sm font-bold text-slate-500">
                      Loading members...
                    </div>
                  )}

                  {!loadingMembers &&
                    filteredMembers.slice(0, 12).map((member) => {
                      const checked = alreadyCheckedIn(member.id);

                      return (
                        <MemberResultCard
                          key={member.id}
                          member={member}
                          checked={checked}
                          disabled={!selectedSessionId || savingMemberId === member.id}
                          saving={savingMemberId === member.id}
                          onCheckin={() => handleCheckin(member)}
                        />
                      );
                    })}

                  {!loadingMembers && filteredMembers.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-10 text-center">
                      <div className="text-5xl">🌿</div>
                      <p className="mt-4 text-xl font-black text-emerald-900">
                        ไม่พบสมาชิกที่ค้นหา
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        ลองค้นหาด้วยชื่อเล่น เบอร์โทร หรืออีเมล
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/82 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.55),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(167,243,208,0.42),transparent_38%)]" />
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
              <div className="pointer-events-none absolute bottom-8 right-8 text-5xl opacity-20">
                🌊
              </div>

              <div className="relative">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-emerald-700">
                  🕘 Latest Check-In
                </p>

                <h2 className="text-4xl font-black leading-tight tracking-tight text-emerald-950">
                  Latest Check-In
                </h2>

                <p className="mt-3 text-base font-bold text-slate-500">
                  เช็คอินล่าสุด
                </p>

                {latestCheckin ? (
                  <div className="mt-8 flex flex-col items-center text-center">
                    <Avatar
                      src={latestCheckin.members?.profile_photo_url}
                      name={latestCheckin.members?.full_name}
                      size="xl"
                    />

                    <h3 className="mt-6 text-3xl font-black leading-tight text-slate-950">
                      {latestCheckin.members?.full_name || "-"}
                    </h3>

                    {latestCheckin.members?.nickname && (
                      <p className="mt-1 text-xl font-semibold text-slate-500">
                        {latestCheckin.members.nickname}
                      </p>
                    )}

                    <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2 text-2xl font-black text-emerald-700">
                      <span>✅</span>
                      Checked In
                    </p>

                    <p className="mt-3 text-sm font-bold text-slate-500">
                      {formatCheckinTime(
                        latestCheckin.checkin_time || latestCheckin.created_at
                      )}
                    </p>

                    <div className="my-7 flex w-full items-center gap-3">
                      <div className="h-px flex-1 bg-emerald-100" />
                      <span className="text-xl opacity-50">🌿</span>
                      <div className="h-px flex-1 bg-emerald-100" />
                    </div>

                    <div className="inline-flex min-w-[210px] flex-col items-center rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-white px-10 py-6 shadow-[0_18px_40px_rgba(22,101,52,0.16)]">
                      <span className="text-6xl font-black leading-none tracking-tight text-emerald-700">
                        {latestMemberTotalVisits}
                      </span>

                      <span className="mt-3 text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-800">
                        visits total
                      </span>
                    </div>

                    <p className="mt-7 max-w-xs text-sm font-medium leading-6 text-emerald-800">
                      Every visit nurtures your mind and brings peace to the world.
                    </p>
                  </div>
                ) : (
                  <WaitingCard />
                )}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/35 blur-3xl" />

              <div className="relative">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                      Attendance
                    </p>

                    <h3 className="mt-1 text-2xl font-black text-emerald-950">
                      Recent 5
                    </h3>
                  </div>

                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {checkedInCount} checked in
                  </span>
                </div>

                {latestFiveCheckins.length > 0 ? (
                  <div className="space-y-3">
                    {latestFiveCheckins.map((item) => (
                      <RecentCheckinRow
                        key={item.id}
                        item={item}
                        onDelete={() => handleDeleteCheckin(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-5 py-8 text-center shadow-sm backdrop-blur-xl">
                    <div className="text-5xl">🙏</div>

                    <h3 className="mt-4 text-xl font-black text-emerald-900">
                      No check-ins yet
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      เมื่อเช็คอินแล้ว รายชื่อจะแสดงที่นี่ทันที
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckinBackground() {
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[110px] overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-3 text-center shadow-sm backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-emerald-700">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function MemberResultCard({
  member,
  checked,
  disabled,
  saving,
  onCheckin,
}: {
  member: any;
  checked: boolean;
  disabled: boolean;
  saving: boolean;
  onCheckin: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/82 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:p-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={member.profile_photo_url} name={member.full_name} size="md" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-black text-slate-950">
                {member.full_name || "-"}
              </p>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                Member
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {member.nickname || member.phone || member.email || "Member profile"}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
              {member.phone && <span>📞 {member.phone}</span>}
              {member.email && <span>✉️ {member.email}</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckin}
          disabled={checked || disabled}
          className={
            checked || disabled
              ? "min-h-[52px] min-w-[140px] rounded-2xl bg-slate-200 px-7 py-3 text-base font-black text-slate-500"
              : "min-h-[52px] min-w-[140px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-base font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
          }
        >
          {saving ? "Saving..." : checked ? "Checked In" : "Check In →"}
        </button>
      </div>
    </article>
  );
}

function RecentCheckinRow({
  item,
  onDelete,
}: {
  item: any;
  onDelete: () => void;
}) {
  const memberName = item.members?.full_name || "Member";
  const memberDetail = item.members?.nickname || item.members?.phone || "Checked in";

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 p-3 shadow-sm backdrop-blur transition hover:bg-white hover:shadow-md">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={item.members?.profile_photo_url} name={memberName} size="sm" />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {memberName}
            </p>

            <p className="truncate text-xs font-medium text-slate-500">
              {memberDetail}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <p className="text-xs font-bold text-slate-500">
            {formatCheckinTime(item.checkin_time || item.created_at)}
          </p>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function Avatar({
  src,
  name,
  size,
}: {
  src?: string | null;
  name?: string | null;
  size: "sm" | "md" | "xl";
}) {
  const sizeClass =
    size === "xl" ? "h-36 w-36" : size === "md" ? "h-16 w-16" : "h-11 w-11";

  const textClass =
    size === "xl" ? "text-6xl" : size === "md" ? "text-base" : "text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        className={`${sizeClass} shrink-0 rounded-full object-cover shadow-md ring-4 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${textClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-teal-700 font-black text-white shadow-inner ring-4 ring-white`}
    >
      {size === "xl" ? "🙏" : getInitials(name)}
    </div>
  );
}

function WaitingCard() {
  return (
    <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/75 px-6 py-12 text-center shadow-inner backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white/40 to-emerald-50/80" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-[-40px] h-36 w-36 rounded-full bg-emerald-200/35 blur-2xl" />

      <div className="relative">
        <div className="animate-pulse text-7xl">🙏</div>

        <p className="mt-4 text-2xl font-black text-emerald-900">
          Waiting for Check-In
        </p>

        <p className="mt-2 text-sm text-slate-500">
          เมื่อเช็คอินสำเร็จ สมาชิกคนล่าสุดจะแสดงตรงนี้
        </p>
      </div>
    </div>
  );
}