import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = new Date().toISOString().split("T")[0];

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const monthStart = firstDayOfMonth.toISOString().split("T")[0];

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: todayCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("checkin_date", today);

  const { data: monthCheckins } = await supabase
    .from("checkins")
    .select("*")
    .gte("checkin_date", monthStart);

  const { data: allCheckins } = await supabase
    .from("checkins")
    .select("*, members(*)");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("event_date", { ascending: false });

  const totalMembers = members?.length || 0;
  const totalCheckinsToday = todayCheckins?.length || 0;
  const totalCheckinsThisMonth = monthCheckins?.length || 0;
  const totalCheckinsAllTime = allCheckins?.length || 0;
  const totalSessions = sessions?.length || 0;

  const checkinTarget = 2222;
  const checkinRemaining = Math.max(checkinTarget - totalCheckinsAllTime, 0);
  const checkinProgress = Math.min(
    (totalCheckinsAllTime / checkinTarget) * 100,
    100
  );

  const latestMembers = members?.slice(0, 5) || [];
  const latestSessions = sessions?.slice(0, 5) || [];

  const attendanceCountByMember: Record<string, any> = {};

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
    .filter((item: any) => item.member)
    .filter(
      (item: any) => !excludedTopMemberNames.includes(item.member.full_name)
    )
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec]">
      <DashboardBackground />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/70 bg-white/70 p-6 shadow-[20px_0_80px_rgba(15,23,42,0.06)] backdrop-blur-2xl lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-teal-400 to-emerald-500 text-2xl text-white shadow-xl shadow-emerald-200/60">
              ✦
            </div>

            <div>
              <p className="font-black leading-tight text-slate-950">
                Dunedin
              </p>
              <p className="font-black leading-tight text-slate-950">
                Meditation Hub
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-3">
            <SideLink href="/" icon="⌂" label="หน้าแรก" active />
            <SideLink href="/checkin" icon="✓" label="เช็คอินสมาชิก" />
            <SideLink href="/staff" icon="👥" label="รายชื่อเจ้าหน้าที่" />
            <SideLink href="/checkin/scan" icon="▦" label="สแกน QR เช็คอิน" />
            <SideLink href="/sessions" icon="▣" label="จัดการรอบกิจกรรม" />
            <SideLink href="/members" icon="☷" label="สมาชิกทั้งหมด" />
            <SideLink href="/attendance" icon="▥" label="รายงานการเข้าร่วม" />
            <SideLink href="/export" icon="⇩" label="ส่งออกข้อมูล" />
            <SideLink href="/import" icon="⇧" label="นำเข้าข้อมูล" />
            <SideLink href="/reports" icon="⚙" label="จัดการผู้ดูแลระบบ" />
          </nav>

          <div className="absolute bottom-6 left-6 right-6 overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
                ●
              </div>

              <div>
                <p className="font-bold text-emerald-900">Admin</p>
                <p className="text-sm text-slate-500">ผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="mx-auto w-full max-w-7xl p-5 sm:p-8 lg:p-10">
          <HeroHeader />

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <BigStat
              icon="👥"
              title="สมาชิกทั้งหมด / Total Members"
              value={totalMembers}
              unit="ท่าน"
              color="text-blue-600"
              glow="bg-blue-200/50"
            />

            <BigStat
              icon="✓"
              title="เช็คอินสะสมทั้งหมด / All-Time Check-ins"
              value={totalCheckinsAllTime}
              unit="ครั้ง"
              color="text-emerald-600"
              glow="bg-emerald-200/60"
            />

            <GoalCard
              current={totalCheckinsAllTime}
              target={checkinTarget}
              remaining={checkinRemaining}
              progress={checkinProgress}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <StatCard
              icon="📅"
              title="Sessions ทั้งหมด / Total Sessions"
              value={totalSessions}
              unit="รอบ"
              tone="emerald"
            />

            <StatCard
              icon="🌤️"
              title="เช็คอินวันนี้ / Today"
              value={totalCheckinsToday}
              unit="ครั้ง"
              tone="sky"
            />

            <StatCard
              icon="🌿"
              title="เช็คอินเดือนนี้ / This Month"
              value={totalCheckinsThisMonth}
              unit="ครั้ง"
              tone="amber"
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <a href="/checkin" className="lg:col-span-2">
              <CheckinActionCard />
            </a>

            <a href="/checkin/scan">
              <MenuCard icon="▦" title="QR Scanner" subtitle="สแกน QR เช็คอิน" />
            </a>

            <a href="/sessions">
              <MenuCard icon="📅" title="Sessions" subtitle="จัดการรอบกิจกรรม" />
            </a>

            <a href="/reports">
              <MenuCard
                icon="▥"
                title="Analytics Report"
                subtitle="กราฟการเข้าร่วม"
              />
            </a>

            <a href="/attendance">
              <MenuCard
                icon="📄"
                title="Attendance Report"
                subtitle="รายงานการเข้าร่วม"
              />
            </a>

            <a href="/register">
              <MenuCard
                icon="➕"
                title="New Registration"
                subtitle="ลงทะเบียนสมาชิกใหม่"
              />
            </a>

            <a href="/members">
              <MenuCard icon="👥" title="Members" subtitle="ฐานข้อมูลสมาชิก" />
            </a>

            <a href="/staff">
              <MenuCard icon="👨‍💼" title="Staff" subtitle="รายชื่อเจ้าหน้าที่" />
            </a>

            <a href="/import">
              <MenuCard
                icon="⇧"
                title="Import Excel"
                subtitle="นำเข้าข้อมูลสมาชิก"
              />
            </a>

            <a href="/export">
              <MenuCard
                icon="⇩"
                title="Export Excel"
                subtitle="ส่งออกข้อมูลสมาชิก"
              />
            </a>

            <MenuCard icon="🛡️" title="Admin Panel" subtitle="ระบบผู้ดูแล" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <GlassSection title="🏆 Top 10 Most Active Members">
              <div className="space-y-3">
                {topMembers.map((item: any, index: number) => (
                  <div
                    key={item.member.id}
                    className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                        {index + 1}
                      </div>

                      <MemberAvatar member={item.member} />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {item.member.full_name || "-"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {item.member.phone || item.member.email || "-"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}

                {topMembers.length === 0 && (
                  <EmptyState text="ยังไม่มีข้อมูลการเข้าร่วม / No attendance yet" />
                )}
              </div>
            </GlassSection>

            <GlassSection title="🌸 สมาชิกใหม่ล่าสุด / Latest Members">
              <div className="space-y-3">
                {latestMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur"
                  >
                    <MemberAvatar member={member} />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
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

            <GlassSection title="🌿 Sessions ล่าสุด / Latest Sessions">
              <div className="space-y-3">
                {latestSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-amber-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur"
                  >
                    <p className="font-semibold text-slate-900">
                      {session.session_name || "-"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.event_date || "-"} · {session.start_time || "-"} -{" "}
                      {session.end_time || "-"}
                    </p>
                  </div>
                ))}

                {latestSessions.length === 0 && (
                  <EmptyState text="ยังไม่มี Session / No sessions yet" />
                )}
              </div>
            </GlassSection>

            <GlassSection title="🕊️ System Summary">
              <div className="space-y-4">
                <SummaryRow label="Members" value={totalMembers} />
                <SummaryRow label="Sessions" value={totalSessions} />
                <SummaryRow label="Check-ins" value={totalCheckinsAllTime} />

                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/75 p-5 shadow-sm backdrop-blur">
                  <p className="text-sm font-medium text-slate-500">
                    Average Attendance / Session
                  </p>
                  <p className="mt-2 text-4xl font-black text-emerald-600">
                    {totalSessions > 0
                      ? (totalCheckinsAllTime / totalSessions).toFixed(1)
                      : 0}
                  </p>
                </div>
              </div>
            </GlassSection>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.13),transparent_28%),linear-gradient(135deg,#f8fbf6_0%,#fff8ec_48%,#eef9f4_100%)]"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute left-[18%] top-[-120px] h-[460px] w-[560px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[22%] h-[520px] w-[520px] rounded-full bg-lime-200/25 blur-3xl" />

        <div className="absolute left-[44%] top-20 h-28 w-28 rounded-full border border-emerald-200/50 bg-white/30 backdrop-blur-sm" />
        <div className="absolute right-[12%] top-44 h-16 w-16 rounded-full border border-sky-200/60 bg-white/30 backdrop-blur-sm" />
        <div className="absolute bottom-40 left-[34%] h-20 w-20 rounded-full border border-amber-200/60 bg-white/30 backdrop-blur-sm" />

        <div className="absolute right-12 top-28 text-6xl opacity-30">🕊️</div>
        <div className="absolute left-[19%] bottom-28 text-6xl opacity-25">🌿</div>
        <div className="absolute right-[28%] bottom-20 text-5xl opacity-25">🌸</div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 w-full opacity-35"
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

function HeroHeader() {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/65 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.75),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.55),transparent_34%)]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-8 text-6xl opacity-35">
        🕊️
      </div>
      <div className="pointer-events-none absolute bottom-8 right-28 text-5xl opacity-30">
        🌸
      </div>
      <div className="pointer-events-none absolute bottom-8 left-8 text-5xl opacity-25">
        🌿
      </div>
      <div className="pointer-events-none absolute right-12 bottom-10 text-6xl opacity-25">
        🌊
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-sm font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
            Mindfulness • Community • Wellbeing
          </p>

          <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight text-emerald-800 drop-shadow-sm md:text-7xl">
            Dunedin Meditation Hub
          </h1>

          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
            ระบบเช็คอินและฐานข้อมูลผู้เข้าร่วมสมาธิ / Meditation Check-in &
            Member Database System
          </p>
        </div>

        <div className="shrink-0">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}

function CheckinActionCard() {
  return (
    <div className="group relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 p-8 text-white shadow-[0_28px_90px_rgba(20,184,166,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_100px_rgba(20,184,166,0.48)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.20),transparent_34%)]" />
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/20 blur-3xl transition group-hover:scale-125" />
      <div className="absolute bottom-6 right-8 text-6xl opacity-35 transition group-hover:scale-110">
        🌊
      </div>
      <div className="absolute right-24 top-8 text-4xl opacity-30">🕊️</div>

      <div className="relative flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl text-teal-500 shadow-xl">
          ✓
        </div>

        <div>
          <h2 className="text-4xl font-black">Check-in</h2>
          <p className="mt-2 text-xl font-bold">เช็คอินสมาชิก</p>
          <p className="mt-2 text-white/90">คลิกเพื่อเช็คอินสมาชิกทันที</p>
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
    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-200/80 bg-white/80 p-6 shadow-[0_24px_70px_rgba(16,185,129,0.16)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-[-60px] h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-4 right-6 text-5xl opacity-25">
        🌱
      </div>

      <div className="relative">
        <p className="text-lg font-black text-slate-700">
          เป้าหมายเช็คอินสะสม
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs font-bold text-slate-500">เป้าหมาย</p>
            <p className="text-2xl font-black text-slate-900">
              {target.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">ครั้ง</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">เหลืออีก</p>
            <p className="text-2xl font-black text-slate-900">
              {remaining.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">ครั้ง</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">บรรลุแล้ว</p>
            <p className="text-2xl font-black text-emerald-600">
              {progress.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-xs font-medium text-slate-500">
          Current: {current.toLocaleString()} check-ins
        </p>
      </div>
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
    <a
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${
        active
          ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
          : "text-slate-600 hover:bg-white/80 hover:text-teal-600 hover:shadow-sm"
      }`}
    >
      <span className="w-6 text-center text-xl">{icon}</span>
      {label}
    </a>
  );
}

function BigStat({
  icon,
  title,
  value,
  unit,
  color,
  glow,
}: {
  icon: string;
  title: string;
  value: number;
  unit: string;
  color: string;
  glow: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${glow} blur-3xl transition duration-300 group-hover:scale-125`}
      />
      <div className="pointer-events-none absolute bottom-4 right-6 text-7xl opacity-10 transition duration-300 group-hover:scale-110 group-hover:opacity-20">
        {icon}
      </div>

      <div className="relative flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white to-slate-50 text-4xl shadow-inner ring-1 ring-slate-100">
          {icon}
        </div>

        <div>
          <p className="max-w-[220px] text-base font-black leading-snug text-slate-600">
            {title}
          </p>

          <p className={`mt-2 text-7xl font-black leading-none ${color}`}>
            {value.toLocaleString()}
          </p>

          <p className="mt-2 text-lg font-bold text-slate-500">{unit}</p>
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
  tone: "emerald" | "sky" | "amber";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-50 to-blue-50 text-sky-700 ring-sky-100"
      : tone === "amber"
        ? "from-amber-50 to-orange-50 text-amber-700 ring-amber-100"
        : "from-emerald-50 to-lime-50 text-emerald-700 ring-emerald-100";

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_24px_75px_rgba(15,23,42,0.13)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />

      <div className="relative flex items-center gap-5">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-inner ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-4xl font-black text-slate-900">
            {value.toLocaleString()}{" "}
            <span className="text-base font-bold text-slate-500">{unit}</span>
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
    <div className="group relative h-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_24px_75px_rgba(15,23,42,0.15)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl transition duration-300 group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-12 bottom-[-50px] h-32 w-32 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="relative flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/80 bg-gradient-to-br from-emerald-50 to-sky-50 text-3xl shadow-inner ring-1 ring-emerald-100 transition duration-300 group-hover:scale-105">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function GlassSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-[-60px] h-32 w-32 rounded-full bg-sky-100/60 blur-3xl" />

      <div className="relative">
        <h2 className="mb-5 text-xl font-black text-slate-900">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-2xl border border-slate-100 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-black text-slate-900">{value.toLocaleString()}</span>
    </div>
  );
}

function MemberAvatar({ member }: { member: any }) {
  if (member.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 ring-2 ring-white">
      -
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-4 py-8 text-center text-slate-500 backdrop-blur">
      {text}
    </p>
  );
}