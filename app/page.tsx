import type { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = new Date().toISOString().split("T")[0];

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const monthStart = firstDayOfMonth.toISOString().split("T")[0];

  const {
    data: members,
    count: totalMembersCount,
    error: membersError,
  } = await supabase
    .from("members")
    .select("*", { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (membersError) {
    console.error("LOAD MEMBERS ERROR:", membersError);
  }

  const { data: todayCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("checkin_date", today);

  const { data: monthCheckins } = await supabase
    .from("checkins")
    .select("*")
    .gte("checkin_date", monthStart);

  const { data: allCheckins, count: totalCheckinsCount } = await supabase
  .from("checkins")
  .select("*, members(*)", { count: "exact" });

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("event_date", { ascending: false });

  const totalMembers = totalMembersCount ?? members?.length ?? 0;
  const totalCheckinsToday = todayCheckins?.length || 0;
  const totalCheckinsThisMonth = monthCheckins?.length || 0;
  const totalCheckinsAllTime =
  totalCheckinsCount ?? allCheckins?.length ?? 0;
  const totalSessions = sessions?.length || 0;

  const checkinTarget = 2222;
  const checkinRemaining = Math.max(checkinTarget - totalCheckinsAllTime, 0);
  const checkinProgress = Math.min(
    (totalCheckinsAllTime / checkinTarget) * 100,
    100
  );

  const latestMembers = members?.slice(0, 5) || [];
  const latestSessions = sessions?.slice(0, 5) || [];

  const attendanceCountByMember: Record<
    string,
    { member: any; count: number }
  > = {};

  (allCheckins || []).forEach((item) => {
    const memberId = item.member_id;

    if (!memberId) return;

    if (!attendanceCountByMember[memberId]) {
      attendanceCountByMember[memberId] = {
        member: item.members,
        count: 0,
      };
    }

    attendanceCountByMember[memberId].count += 1;
  });

  const excludedTopMemberNames = [
    "Autsarangkool Phabsink",
    "Phanurak Ranron",
    "Phra Sangwian Khanchaiyaphum",
    "Benjamaphorn Bounoon",
    "PhraAkebordin Rattana Ph.D",
    "Prasong Somnoi Ph.D",
  ];

  const topMembers = Object.values(attendanceCountByMember)
    .filter((item) => item.member)
    .filter(
      (item) => !excludedTopMemberNames.includes(item.member.full_name)
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <DashboardBackground />

      <div className="relative z-10 flex min-h-screen">
        <DashboardSidebar />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
          <div className="mx-auto max-w-[1500px]">
            <MobileBrandBar />

            <HeroHeader />

            <div className="mt-6 grid gap-5 xl:grid-cols-3">
              <BigStat
                icon="👥"
                title="สมาชิกทั้งหมด / Total Members"
                value={totalMembers}
                unit="ท่าน"
                tone="blue"
              />

              <BigStat
                icon="✓"
                title="เช็คอินสะสมทั้งหมด / All-Time Check-ins"
                value={totalCheckinsAllTime}
                unit="ครั้ง"
                tone="emerald"
              />

              <GoalCard
                current={totalCheckinsAllTime}
                target={checkinTarget}
                remaining={checkinRemaining}
                progress={checkinProgress}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <StatCard
                icon="📅"
                title="Sessions ทั้งหมด / Total Sessions"
                value={totalSessions}
                unit="รอบ"
                tone="emerald"
              />

              <StatCard
                icon="☀️"
                title="เช็คอินวันนี้ / Today"
                value={totalCheckinsToday}
                unit="ครั้ง"
                tone="sky"
              />

              <StatCard
                icon="🌊"
                title="เช็คอินเดือนนี้ / This Month"
                value={totalCheckinsThisMonth}
                unit="ครั้ง"
                tone="blue"
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/checkin" className="md:col-span-2">
                <CheckinActionCard />
              </Link>

              <Link href="/checkin/scan">
                <MenuCard
                  icon="▦"
                  title="QR Scanner"
                  subtitle="สแกน QR เช็คอิน"
                />
              </Link>

              <Link href="/sessions">
                <MenuCard
                  icon="📅"
                  title="Sessions"
                  subtitle="จัดการรอบกิจกรรม"
                />
              </Link>

              <Link href="/reports">
                <MenuCard
                  icon="▥"
                  title="Analytics Report"
                  subtitle="กราฟการเข้าร่วม"
                />
              </Link>

              <Link href="/attendance">
                <MenuCard
                  icon="📄"
                  title="Attendance Report"
                  subtitle="รายงานการเข้าร่วม"
                />
              </Link>

              <Link href="/register">
                <MenuCard
                  icon="➕"
                  title="New Registration"
                  subtitle="ลงทะเบียนสมาชิกใหม่"
                />
              </Link>

              <Link href="/members">
                <MenuCard
                  icon="👥"
                  title="Members"
                  subtitle="ฐานข้อมูลสมาชิก"
                />
              </Link>

              <Link href="/staff">
                <MenuCard
                  icon="👨‍💼"
                  title="Staff"
                  subtitle="รายชื่อเจ้าหน้าที่"
                />
              </Link>

              <Link href="/import">
                <MenuCard
                  icon="⇧"
                  title="Import Excel"
                  subtitle="นำเข้าข้อมูลสมาชิก"
                />
              </Link>

              <Link href="/export">
                <MenuCard
                  icon="⇩"
                  title="Export Excel"
                  subtitle="ส่งออกข้อมูลสมาชิก"
                />
              </Link>

              <Link href="/reports">
                <MenuCard
                  icon="🛡️"
                  title="Admin Panel"
                  subtitle="ระบบผู้ดูแล"
                />
              </Link>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              <GlassSection
                eyebrow="Community"
                title="🏆 Top 10 Most Active Members"
              >
                <div className="space-y-3">
                  {topMembers.map((item, index) => (
                    <div
                      key={item.member.id}
                      className="group flex items-center justify-between gap-3 rounded-[1.4rem] border border-sky-100/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 font-black text-sky-700 ring-1 ring-white">
                          {index + 1}
                        </div>

                        <MemberAvatar member={item.member} />

                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {item.member.full_name || "-"}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {item.member.phone || item.member.email || "-"}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                        {item.count} ครั้ง
                      </span>
                    </div>
                  ))}

                  {topMembers.length === 0 && (
                    <EmptyState text="ยังไม่มีข้อมูลการเข้าร่วม / No attendance yet" />
                  )}
                </div>
              </GlassSection>

              <GlassSection
                eyebrow="New friends"
                title="🌺 สมาชิกใหม่ล่าสุด / Latest Members"
              >
                <div className="space-y-3">
                  {latestMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-[1.4rem] border border-sky-100/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur"
                    >
                      <MemberAvatar member={member} />

                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {member.full_name || "-"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {member.phone || member.email || "-"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {latestMembers.length === 0 && (
                    <EmptyState text="ยังไม่มีสมาชิก / No members yet" />
                  )}
                </div>
              </GlassSection>

              <GlassSection
                eyebrow="Upcoming practice"
                title="🌊 Sessions ล่าสุด / Latest Sessions"
              >
                <div className="space-y-3">
                  {latestSessions.map((session) => (
                    <div
                      key={session.id}
                      className="relative overflow-hidden rounded-[1.4rem] border border-cyan-100/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur"
                    >
                      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-100 blur-2xl" />

                      <div className="relative">
                        <p className="font-bold text-slate-900">
                          {session.session_name || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {session.event_date || "-"} ·{" "}
                          {session.start_time || "-"} -{" "}
                          {session.end_time || "-"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {latestSessions.length === 0 && (
                    <EmptyState text="ยังไม่มี Session / No sessions yet" />
                  )}
                </div>
              </GlassSection>

              <GlassSection eyebrow="Overview" title="🕊️ System Summary">
                <div className="space-y-4">
                  <SummaryRow label="Members" value={totalMembers} />
                  <SummaryRow label="Sessions" value={totalSessions} />
                  <SummaryRow
                    label="Check-ins"
                    value={totalCheckinsAllTime}
                  />

                  <div className="relative overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-sky-50/70 p-5 shadow-sm">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/40 blur-2xl" />

                    <div className="relative">
                      <p className="text-sm font-bold text-slate-500">
                        Average Attendance / Session
                      </p>
                      <p className="mt-2 bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-5xl font-black text-transparent">
                        {totalSessions > 0
                          ? (
                              totalCheckinsAllTime / totalSessions
                            ).toFixed(1)
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassSection>
            </div>

            <footer className="py-8 text-center text-xs font-semibold text-slate-400">
              Dunedin Meditation Hub · A calm mind, a kind heart, a better world.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardSidebar() {
  const links = [
    { href: "/", icon: "⌂", label: "หน้าแรก", active: true },
    { href: "/checkin", icon: "✓", label: "เช็คอินสมาชิก" },
    { href: "/staff", icon: "👥", label: "รายชื่อเจ้าหน้าที่" },
    { href: "/checkin/scan", icon: "▦", label: "สแกน QR เช็คอิน" },
    { href: "/sessions", icon: "▣", label: "จัดการรอบกิจกรรม" },
    { href: "/members", icon: "☷", label: "สมาชิกทั้งหมด" },
    { href: "/attendance", icon: "▥", label: "รายงานการเข้าร่วม" },
    { href: "/export", icon: "⇩", label: "ส่งออกข้อมูล" },
    { href: "/import", icon: "⇧", label: "นำเข้าข้อมูล" },
    { href: "/reports", icon: "⚙", label: "จัดการผู้ดูแลระบบ" },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 overflow-y-auto border-r border-sky-100/80 bg-white/72 p-6 shadow-[18px_0_70px_rgba(56,189,248,0.08)] backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-500 via-teal-400 to-sky-400 text-3xl text-white shadow-lg shadow-sky-200/70 ring-1 ring-white">
          🪷
        </div>

        <div>
          <p className="font-black leading-tight text-slate-950">Dunedin</p>
          <p className="font-black leading-tight text-slate-950">
            Meditation Hub
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-500">
            Summer Sanctuary
          </p>
        </div>
      </div>

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />

      <nav className="space-y-2">
        {links.map((link) => (
          <SideLink key={link.href} {...link} />
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-sky-100 bg-gradient-to-br from-white via-teal-50/80 to-emerald-50/70 p-4 shadow-lg">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-200/50 blur-2xl" />
          <div className="pointer-events-none absolute bottom-2 right-3 text-3xl opacity-25">
            ☀️
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md ring-2 ring-white">
              ●
            </div>

            <div>
              <p className="font-bold text-slate-900">Admin</p>
              <p className="text-sm text-slate-500">ผู้ดูแลระบบ</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileBrandBar() {
  return (
    <div className="mb-5 flex items-center justify-between rounded-[1.5rem] border border-sky-100 bg-white/80 p-3 shadow-lg shadow-sky-100/40 backdrop-blur-xl lg:hidden">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-400 to-sky-400 text-xl text-white">
          🪷
        </div>

        <div>
          <p className="text-sm font-black text-slate-950">
            Dunedin Meditation Hub
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-500">
            Summer Sanctuary
          </p>
        </div>
      </Link>

      <AuthButton />
    </div>
  );
}

function DashboardBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#effcf6]"
    >
      <img
        src="/images/summer-sanctuary-background.png"
        alt=""
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/12" />
    </div>
  );
}

function HeroHeader() {
  return (
    <header className="relative overflow-hidden rounded-[2.4rem] border border-cyan-100/90 bg-gradient-to-r from-white via-cyan-50 to-sky-100 p-6 shadow-[0_30px_90px_rgba(8,145,178,0.2)] backdrop-blur-2xl sm:p-8 lg:min-h-[330px]">
      <img
        src="/images/summer-sanctuary-hero.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-[center_52%] lg:block"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent lg:via-white/75" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-[radial-gradient(circle_at_bottom_left,rgba(255,237,213,0.72),transparent_52%)]" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl lg:max-w-[56%]">
          <p className="inline-flex rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-600 shadow-sm backdrop-blur">
            ☀️ Mindfulness • Community • Wellbeing
          </p>

          <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
            Dunedin Meditation Hub
          </h1>

          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
            ระบบเช็คอินและฐานข้อมูลผู้เข้าร่วมสมาธิ / Meditation Check-in
            &amp; Member Database System
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/checkin"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-400 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-200/60 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              ✓ Check-In Member
            </Link>

            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200 bg-white/85 px-5 py-3 text-sm font-black text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
            >
              + New Registration
            </Link>
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function DunedinSummerLandscape() {
  return (
    <svg
      viewBox="0 0 620 330"
      className="h-auto w-full drop-shadow-[0_20px_28px_rgba(8,145,178,0.2)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dunedinSummerSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dff8ff" />
          <stop offset="58%" stopColor="#a5e8f5" />
          <stop offset="100%" stopColor="#fff1b8" />
        </linearGradient>
        <linearGradient id="otagoHarbour" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#45c9df" />
          <stop offset="100%" stopColor="#0b91bd" />
        </linearGradient>
      </defs>
      <rect x="60" y="35" width="560" height="295" rx="48" fill="url(#dunedinSummerSky)" opacity="0.96" />
      <circle cx="514" cy="78" r="34" fill="#ffe783" opacity="0.95" />

      <path d="M60 194c65-54 119-69 181-37 60 31 99 22 155-20 65-49 133-39 224 30v80H60Z" fill="#73bd79" />
      <path d="M60 215c84-32 151-25 221 9 74 35 159 27 339-31v137H60Z" fill="url(#otagoHarbour)" />
      <path d="M60 284c108-24 188-14 278 16 79 26 166 20 282-12v42H60Z" fill="#b9f0e1" opacity="0.85" />

      <g fill="#ffffff" opacity="0.95">
        <path d="M330 225l22-42 22 42Z" />
        <rect x="350" y="221" width="4" height="32" rx="2" />
        <path d="M435 243l18-35 18 35Z" />
        <rect x="451" y="240" width="4" height="27" rx="2" />
      </g>

      <g transform="translate(415 144)">
        <rect x="8" y="73" width="142" height="55" rx="5" fill="#c88b56" />
        <path d="M0 76 78 39l82 37Z" fill="#713e35" />
        <rect x="63" y="10" width="30" height="105" rx="3" fill="#d9a36a" />
        <path d="M58 15 78-8l20 23Z" fill="#365c50" />
        <circle cx="78" cy="32" r="9" fill="#fff4c2" stroke="#5d4638" strokeWidth="3" />
        <rect x="74" y="62" width="8" height="18" fill="#5d4638" />
        {[22, 45, 108, 131].map((x) => (
          <rect key={x} x={x} y="88" width="13" height="18" rx="2" fill="#fff1ad" />
        ))}
      </g>

      <g fill="#fff7da" opacity="0.9">
        <path d="M110 174l20-17 20 17v28h-40Z" />
        <path d="M155 187l17-15 18 15v25h-35Z" />
        <path d="M206 181l19-16 20 16v29h-39Z" />
      </g>
      <g fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.9">
        <path d="M300 90q12-10 24 0q12-10 24 0" />
        <path d="M380 70q10-8 20 0q10-8 20 0" />
      </g>
      <g fill="#ef4444" opacity="0.9">
        <circle cx="585" cy="115" r="8" />
        <circle cx="600" cy="105" r="7" />
        <circle cx="573" cy="99" r="6" />
      </g>
    </svg>
  );
}

function CheckinActionCard() {
  return (
    <div className="group relative h-full min-h-[190px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-400 p-7 text-white shadow-[0_28px_80px_rgba(14,165,233,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_95px_rgba(14,165,233,0.4)] sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.42),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_34%)]" />
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl transition group-hover:scale-125" />
      <div className="absolute bottom-4 right-6 text-6xl opacity-25 transition group-hover:scale-110">
        🌊
      </div>

      <div className="relative flex h-full items-center gap-5 sm:gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-4xl text-sky-500 shadow-xl ring-4 ring-white/40">
          ✓
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
            Main action
          </p>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl">Check-In</h2>
          <p className="mt-2 text-lg font-bold">เช็คอินสมาชิก</p>
          <p className="mt-2 text-sm font-semibold text-white/85">
            ค้นหาสมาชิกและบันทึกการเข้าร่วมได้ทันที
          </p>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  current,
  target,
  remaining,
  progress,
}: {
  current: number;
  target: number;
  remaining: number;
  progress: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-sky-100/90 bg-white/82 p-6 shadow-[0_24px_70px_rgba(56,189,248,0.14)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-[-60px] h-36 w-36 rounded-full bg-emerald-200/32 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 right-6 text-5xl opacity-20">
        🎯
      </div>

      <div className="relative">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-500">
          Community Goal
        </p>
        <h2 className="mt-2 text-lg font-black text-slate-800">
          เป้าหมายเช็คอินสะสม
        </h2>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <GoalValue label="เป้าหมาย" value={target} suffix="ครั้ง" />
          <GoalValue label="เหลืออีก" value={remaining} suffix="ครั้ง" />
          <div className="rounded-xl bg-emerald-50/80 px-2 py-3">
            <p className="text-[11px] font-bold text-slate-500">บรรลุแล้ว</p>
            <p className="mt-1 text-xl font-black text-emerald-600">
              {progress.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-sky-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-500">
          Current: {current.toLocaleString()} check-ins
        </p>
      </div>
    </div>
  );
}

function GoalValue({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-xl bg-sky-50/75 px-2 py-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] font-semibold text-slate-400">{suffix}</p>
    </div>
  );
}

function SideLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700 shadow-sm ring-1 ring-sky-100"
          : "text-slate-600 hover:bg-white/90 hover:text-sky-700 hover:shadow-sm"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function BigStat({
  icon,
  title,
  value,
  unit,
  tone,
}: {
  icon: string;
  title: string;
  value: number;
  unit: string;
  tone: "blue" | "emerald";
}) {
  const valueClass =
    tone === "blue" ? "text-blue-600" : "text-emerald-600";
  const glowClass =
    tone === "blue" ? "bg-sky-200/55" : "bg-emerald-200/55";
  const iconClass =
    tone === "blue"
      ? "from-sky-50 to-cyan-100 ring-sky-100"
      : "from-emerald-50 to-cyan-100 ring-emerald-100";

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-sky-100/90 bg-white/82 p-6 shadow-[0_24px_70px_rgba(56,189,248,0.12)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_30px_85px_rgba(56,189,248,0.18)] sm:p-7">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${glowClass} blur-3xl transition duration-300 group-hover:scale-125`}
      />
      <div className="pointer-events-none absolute bottom-4 right-6 text-7xl opacity-[0.08] transition group-hover:scale-110 group-hover:opacity-[0.15]">
        {icon}
      </div>

      <div className="relative flex items-center gap-5">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-gradient-to-br text-3xl shadow-inner ring-1 ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black leading-snug text-slate-600">
            {title}
          </p>

          <p
            className={`mt-2 text-5xl font-black leading-none sm:text-6xl ${valueClass}`}
          >
            {value.toLocaleString()}
          </p>

          <p className="mt-2 text-base font-bold text-slate-500">{unit}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  unit,
  tone,
}: {
  icon: string;
  title: string;
  value: number;
  unit: string;
  tone: "emerald" | "sky" | "blue";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-50 to-cyan-100 text-sky-700 ring-sky-100"
      : tone === "blue"
        ? "from-emerald-50 to-sky-100 text-teal-700 ring-cyan-100"
        : "from-emerald-50 to-cyan-100 text-emerald-700 ring-emerald-100";

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-sky-100/80 bg-white/78 p-5 shadow-[0_18px_55px_rgba(56,189,248,0.09)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_24px_70px_rgba(56,189,248,0.14)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-inner ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-black text-slate-900 sm:text-4xl">
            {value.toLocaleString()}{" "}
            <span className="text-sm font-bold text-slate-500">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuCard({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="group relative h-full min-h-[140px] overflow-hidden rounded-[1.8rem] border border-sky-100/80 bg-white/78 p-5 shadow-[0_18px_55px_rgba(56,189,248,0.09)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-white/95 hover:shadow-[0_24px_72px_rgba(56,189,248,0.15)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-200/38 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-12 bottom-[-50px] h-32 w-32 rounded-full bg-emerald-200/26 blur-3xl" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-white bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-3xl shadow-inner ring-1 ring-sky-100 transition group-hover:scale-105">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-end text-sm font-black text-sky-600 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">
        Open →
      </div>
    </div>
  );
}

function GlassSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 p-5 shadow-[0_24px_70px_rgba(56,189,248,0.1)] backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-100/90 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-[-60px] h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">
          {eyebrow}
        </p>
        <h2 className="mb-5 mt-1 text-xl font-black text-slate-900">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-sky-100/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
      <span className="font-bold text-slate-600">{label}</span>
      <span className="rounded-full bg-sky-50 px-3 py-1 font-black text-sky-700">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function MemberAvatar({ member }: { member: any }) {
  if (member.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || "Member"}
        className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-black text-white shadow-sm ring-2 ring-white">
      {initials || "?"}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-sky-200 bg-gradient-to-br from-white/80 to-sky-50/70 px-4 py-8 text-center backdrop-blur">
      <div className="text-4xl">🙏</div>
      <p className="mt-3 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}
