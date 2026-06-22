"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
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

function formatCheckinTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-NZ", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Auckland",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Today";

  try {
    return new Intl.DateTimeFormat("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Pacific/Auckland",
    }).format(new Date(value));
  } catch {
    return "Today";
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
  }, [selectedSessionId]);

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

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  async function loadMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_deleted", false)
      .order("full_name");

    if (error) {
      alert(error.message);
      return;
    }

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
          onConflict: "member_id,session_id",
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
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <CheckinBackground />

      <div className="relative z-10 mx-auto max-w-6xl">
        <section className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
                  Dunedin Meditation Hub
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-6xl">
                  Member Check-in
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  ค้นหาสมาชิก เช็คชื่อ และต้อนรับผู้เข้าร่วมปฏิบัติธรรมอย่างเรียบง่ายและสงบ
                </p>
              </div>

              <div className="grid min-w-[280px] grid-cols-2 gap-3">
                <MiniStat label="Checked in" value={checkedInCount} />
                <MiniStat label="Members" value={totalMembers} />
              </div>
            </div>
          </div>
        </section>

        <section className="relative mb-8 overflow-visible rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">
                  🌤️ Session
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
                  เลือกรอบปฏิบัติธรรม
                </h2>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  เลือก session ที่ต้องการเช็คชื่อผู้เข้าร่วมในวันนี้
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                  พร้อมใช้งาน
                </span>

                <Link
                  href="/sessions"
                  className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  + สร้างรุ่น
                </Link>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Select Session
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSessionDropdownOpen((open) => !open)}
                    className="flex h-14 w-full items-center justify-between rounded-2xl border border-emerald-100 bg-white/85 px-4 text-left text-base font-bold text-slate-800 outline-none shadow-sm backdrop-blur transition hover:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    <span className="truncate">
                      {currentSession
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
                            {session.session_name}
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

              <div className="rounded-[1.75rem] border border-emerald-100 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-bold text-slate-500">
                  Current selection
                </p>

                <p className="mt-2 truncate text-lg font-black text-emerald-950">
                  {currentSession?.session_name || "—"}
                </p>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {currentSession?.session_number || "—"}
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-700">
                  {formatSessionDate(currentSession?.event_date)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-20">
            🔎
          </div>

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
              🌿 Member Check-in
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
              ค้นหาสมาชิกเพื่อเช็คอิน
            </h2>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              พิมพ์ชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล แล้วกด Check-in ได้ทันที
            </p>

            <div className="relative mt-6">
              <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl">
                🔎
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="พิมพ์ชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล..."
                className="h-16 w-full rounded-3xl border border-emerald-100 bg-white/85 pl-14 pr-5 text-base font-medium text-slate-800 shadow-inner outline-none backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {shouldShowMembers && (
              <div className="mt-6 max-h-[560px] space-y-4 overflow-y-auto rounded-[2rem] border border-emerald-100 bg-white/60 p-4 shadow-inner backdrop-blur">
                {filteredMembers.slice(0, 10).map((member) => {
                  const checked = alreadyCheckedIn(member.id);

                  return (
                    <MemberResultCard
                      key={member.id}
                      member={member}
                      checked={checked}
                      disabled={!selectedSessionId}
                      onCheckin={() => handleCheckin(member)}
                    />
                  );
                })}

                {filteredMembers.length === 0 && (
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

        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/70 p-5 shadow-[0_24px_80px_rgba(30,100,130,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-25">
            🌊
          </div>
          <div className="pointer-events-none absolute right-24 bottom-8 text-4xl opacity-20">
            🕊️
          </div>

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700">
              🎉 Latest Check-in
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
              เช็คอินล่าสุด
            </h2>

            {latestCheckin ? (
              <div className="mt-6 flex flex-col items-center rounded-[2rem] border border-white/80 bg-white/78 p-8 text-center shadow-[0_20px_65px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
                <Avatar
                  src={latestCheckin.members?.profile_photo_url}
                  name={latestCheckin.members?.full_name}
                  size="xl"
                />

                <h3 className="mt-5 text-4xl font-black text-slate-950">
                  {latestCheckin.members?.full_name || "-"}
                </h3>

                <p className="mt-1 text-2xl font-semibold text-slate-500">
                  {latestCheckin.members?.nickname || ""}
                </p>

                <p className="mt-5 text-3xl font-black text-emerald-700">
                  Checked in ✅
                </p>

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  {formatCheckinTime(
                    latestCheckin.checkin_time || latestCheckin.created_at
                  )}
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
              <WaitingCard />
            )}
          </div>
        </section>

        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-lime-50/60 to-emerald-50/70 p-5 shadow-[0_24px_80px_rgba(40,100,60,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-4xl opacity-25">
            🍃
          </div>
          <div className="pointer-events-none absolute right-20 bottom-8 text-4xl opacity-20">
            🌼
          </div>

          <div className="relative">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                  🍃 Attendance
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">
                  เช็คอินล่าสุด 5 คน
                </h2>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  รายชื่อผู้เข้าร่วมที่เช็คอินล่าสุดใน Session นี้
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {checkedInCount} checked in
              </div>
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
              <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-10 text-center shadow-sm backdrop-blur-xl">
                <div className="text-5xl">🙏</div>

                <h3 className="mt-4 text-2xl font-black text-emerald-900">
                  ยังไม่มีผู้เข้าร่วมที่เช็คอินใน Session นี้
                </h3>

                <p className="mt-2 text-slate-500">
                  เมื่อสมาชิกเช็คอินแล้ว รายชื่อจะแสดงที่นี่ทันที
                </p>
              </div>
            )}
          </div>
        </section>
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
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-emerald-700">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function MemberResultCard({
  member,
  checked,
  disabled,
  onCheckin,
}: {
  member: any;
  checked: boolean;
  disabled: boolean;
  onCheckin: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:p-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={member.profile_photo_url} name={member.full_name} size="md" />

          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-950">
              {member.full_name || "-"}
            </p>

            <p className="truncate text-sm font-medium text-slate-500">
              {member.nickname || member.phone || member.email || "Member profile"}
            </p>
          </div>
        </div>

        <button
          onClick={onCheckin}
          disabled={checked || disabled}
          className={
            checked || disabled
              ? "min-h-[52px] min-w-[140px] rounded-2xl bg-slate-200 px-7 py-3 text-base font-black text-slate-500"
              : "min-h-[52px] min-w-[140px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3 text-base font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
          }
        >
          {checked ? "Checked in" : "Check-in"}
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
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={item.members?.profile_photo_url} name={memberName} size="sm" />

          <div className="min-w-0">
            <p className="truncate font-black text-slate-950">{memberName}</p>

            <p className="truncate text-sm font-medium text-slate-500">
              {memberDetail}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            Present
          </span>

          <p className="text-sm font-medium text-slate-500">
            {formatCheckinTime(item.checkin_time || item.created_at)}
          </p>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 transition hover:bg-red-600 hover:text-white"
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
    size === "xl" ? "h-40 w-40" : size === "md" ? "h-14 w-14" : "h-11 w-11";

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
    <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/75 px-6 py-12 text-center shadow-inner backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white/40 to-emerald-50/80" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-[-40px] h-36 w-36 rounded-full bg-emerald-200/35 blur-2xl" />

      <div className="relative">
        <div className="animate-pulse text-7xl">🙏</div>

        <p className="mt-4 text-2xl font-black text-emerald-900">
          Waiting for Check-in
        </p>

        <p className="mt-2 text-slate-500">
          เมื่อเช็คอินสำเร็จ สมาชิกคนล่าสุดจะแสดงตรงนี้
        </p>
      </div>
    </div>
  );
}