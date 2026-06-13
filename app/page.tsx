import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";
import RealtimeDashboardStats from "./components/RealtimeDashboardStats";

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
    (item: any) =>
      !excludedTopMemberNames.includes(item.member.full_name)
  )
  .sort((a: any, b: any) => b.count - a.count)
  .slice(0, 10);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f8f4ed] via-[#faf7f1] to-[#f0f7ef]">
      <div className="pointer-events-none fixed inset-0 z-0">
  <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
  <div className="absolute -left-32 bottom-10 h-[420px] w-[420px] rounded-full bg-sky-200/25 blur-3xl" />
  <div className="absolute right-20 top-24 h-40 w-40 rounded-full bg-lime-100/40 blur-2xl" />
</div>
<div className="absolute left-1/2 top-20 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
<div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />

<div className="absolute right-1/4 bottom-20 h-[250px] w-[250px] rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/70 bg-white/60 p-6 shadow-xl backdrop-blur-2xl lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-2xl text-white shadow-lg">
              ✦
            </div>
            <div>
              <p className="font-black text-slate-900">Dunedin</p>
              <p className="font-black text-slate-900">Meditation Hub</p>
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

          <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/85 backdrop-blur-xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white">
                ●
              </div>
              <div>
                <p className="font-bold text-[#24543d]">Admin</p>
                <p className="text-sm text-slate-500">ผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="mx-auto w-full max-w-7xl p-6 lg:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-emerald-700 drop-shadow-sm md:text-7xl">
                Dunedin Meditation Hub
              </h1>
              
              <p className="mt-2 text-lg font-medium text-slate-600">
  Mindfulness • Community • Wellbeing
</p>
              <p className="mt-3 text-base font-medium text-slate-600">
                ระบบเช็คอินและฐานข้อมูลผู้เข้าร่วมสมาธิ / Meditation Check-in & Member Database System
              </p>
            </div>

            <AuthButton />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <BigStat
              icon="👥"
              title="สมาชิกทั้งหมด / Total Members"
              value={totalMembers}
              unit="ท่าน"
              color="text-blue-600"
            />

            <BigStat
              icon="✓"
              title="เช็คอินสะสมทั้งหมด / All-Time Check-ins"
              value={totalCheckinsAllTime}
              unit="ครั้ง"
              color="text-emerald-600"
            />

            <GoalCard
            current={totalCheckinsAllTime}
            target={checkinTarget}
            remaining={checkinRemaining}
            progress={checkinProgress}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <StatCard icon="👥" title="Sessions ทั้งหมด / Total Sessions" value={totalSessions} unit="รอบ" />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <a href="/checkin" className="lg:col-span-2">
              <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 p-8 text-white shadow-2xl transition hover:-translate-y-1 hover:shadow-emerald-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(255,255,255,.35),transparent_35%)]" />
                <div className="relative flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl text-teal-500 shadow-xl">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-4xl font-black">Check-in</h2>
                    <p className="mt-2 text-xl font-bold">เช็คอินสมาชิก</p>
                    <p className="mt-2 text-white/85">คลิกเพื่อเช็คอินสมาชิกทันที</p>
                  </div>
                </div>
              </div>
            </a>

            <a href="/checkin/scan">
              <MenuCard icon="▦" title="QR Scanner" subtitle="สแกน QR เช็คอิน" />
            </a>

            <a href="/sessions">
              <MenuCard icon="📅" title="Sessions" subtitle="จัดการรอบกิจกรรม" />
            </a>

            <a href="/reports">
              <MenuCard icon="▥" title="Analytics Report" subtitle="กราฟการเข้าร่วม" />
            </a>

            <a href="/attendance">
              <MenuCard icon="📄" title="Attendance Report" subtitle="รายงานการเข้าร่วม" />
            </a>

            <a href="/register">
              <MenuCard icon="➕" title="New Registration" subtitle="ลงทะเบียนสมาชิกใหม่" />
            </a>

            <a href="/members">
              <MenuCard icon="👥" title="Members" subtitle="ฐานข้อมูลสมาชิก" />
            </a>
            <a href="/staff">
  <MenuCard
    icon="👨‍💼"
    title="Staff"
    subtitle="รายชื่อเจ้าหน้าที่"
  />
</a>
            <a href="/import">
              <MenuCard icon="⇧" title="Import Excel" subtitle="นำเข้าข้อมูลสมาชิก" />
            </a>

            <a href="/export">
              <MenuCard icon="⇩" title="Export Excel" subtitle="ส่งออกข้อมูลสมาชิก" />
            </a>

            <MenuCard icon="🛡️" title="Admin Panel" subtitle="ระบบผู้ดูแล" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <GlassSection title="Top 10 Most Active Members">
              <div className="space-y-3">
                {topMembers.map((item: any, index: number) => (
                  <div key={item.member.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {index + 1}
                      </div>

                      {item.member.profile_photo_url ? (
                        <img src={item.member.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm">
                          -
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-slate-900">{item.member.full_name || "-"}</p>
                        <p className="text-sm text-slate-500">{item.member.phone || item.member.email || "-"}</p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}

                {topMembers.length === 0 && (
                  <p className="text-slate-500">ยังไม่มีข้อมูลการเข้าร่วม / No attendance yet</p>
                )}
              </div>
            </GlassSection>

            <GlassSection title="สมาชิกใหม่ล่าสุด / Latest Members">
              <div className="space-y-3">
                {latestMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    {member.profile_photo_url ? (
                      <img src={member.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm">
                        -
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-slate-900">{member.full_name || "-"}</p>
                      <p className="text-sm text-slate-500">{member.phone || member.email || "-"}</p>
                    </div>
                  </div>
                ))}

                {latestMembers.length === 0 && (
                  <p className="text-slate-500">ยังไม่มีสมาชิก / No members yet</p>
                )}
              </div>
            </GlassSection>

            <GlassSection title="Sessions ล่าสุด / Latest Sessions">
              <div className="space-y-3">
                {latestSessions.map((session) => (
                  <div key={session.id} className="border-b border-slate-100 pb-3">
                    <p className="font-semibold text-slate-900">{session.session_name || "-"}</p>
                    <p className="text-sm text-slate-500">
                      {session.event_date || "-"} · {session.start_time || "-"} - {session.end_time || "-"}
                    </p>
                  </div>
                ))}

                {latestSessions.length === 0 && (
                  <p className="text-slate-500">ยังไม่มี Session / No sessions yet</p>
                )}
              </div>
            </GlassSection>

            <GlassSection title="System Summary">
              <div className="space-y-4">
                <SummaryRow label="Members" value={totalMembers} />
                <SummaryRow label="Sessions" value={totalSessions} />
                <SummaryRow label="Check-ins" value={totalCheckinsAllTime} />

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">Average Attendance / Session</p>
                  <p className="text-4xl font-black text-emerald-600">
                    {totalSessions > 0 ? (totalCheckinsAllTime / totalSessions).toFixed(1) : 0}
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
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white/85 p-6 shadow-xl backdrop-blur-md">
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
  ? "bg-emerald-50 text-emerald-700 shadow-sm"
          : "text-slate-600 hover:bg-white/70 hover:text-teal-600"
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
}: {
  icon: string;
  title: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
      <div className="absolute bottom-0 right-0 h-24 w-48 rounded-full bg-sky-100/60 blur-2xl" />
      <div className="relative flex items-center gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner">
          {icon}
        </div>

        <div>
          <p className="text-lg font-bold text-slate-600">{title}</p>
          <p className={`mt-2 text-7xl font-black ${color}`}>{value}</p>
          <p className="mt-2 text-xl font-bold text-slate-600">{unit}</p>
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
}: {
  icon: string;
  title: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-1 text-4xl font-black text-slate-900">
            {value} <span className="text-base font-bold text-slate-500">{unit}</span>
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
    <div className="h-full rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl ">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
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
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-md">
      <h2 className="mb-5 text-xl font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}