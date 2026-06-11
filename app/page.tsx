import { supabase } from "@/lib/supabase";
import AttendanceChart from "./components/AttendanceChart";
import AuthButton from "./components/AuthButton";

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

  const newMembersThisMonth =
    members?.filter((member) => {
      if (!member.created_at) return false;
      return member.created_at.slice(0, 10) >= monthStart;
    }).length || 0;

  const totalCheckinsToday = todayCheckins?.length || 0;
  const totalCheckinsThisMonth = monthCheckins?.length || 0;
  const totalCheckinsAllTime = allCheckins?.length || 0;
  const totalSessions = sessions?.length || 0;

  const membersWithPhoto =
    members?.filter((member) => member.profile_photo_url).length || 0;

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

  const topMembers = Object.values(attendanceCountByMember)
    .filter((item: any) => item.member)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  const mostActiveMember = topMembers[0];

  const uniqueParticipants = new Set(
  (allCheckins || [])
    .map((item) => item.member_id)
    .filter(Boolean)
).size;

  const attendanceByMonth: Record<string, number> = {};

  (allCheckins || []).forEach((item) => {
    if (!item.checkin_date) return;

    const month = item.checkin_date.slice(0, 7);
    attendanceByMonth[month] = (attendanceByMonth[month] || 0) + 1;
  });

  const chartData = Object.entries(attendanceByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  const attendanceBySession: Record<string, number> = {};

(allCheckins || []).forEach((item) => {
  if (!item.session_id) return;

  attendanceBySession[item.session_id] =
    (attendanceBySession[item.session_id] || 0) + 1;
});

  return (
    <main className="min-h-screen p-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-6">
            <div>
  <h1 className="text-7xl font-black tracking-tight bg-gradient-to-r from-red-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
  Dunedin Meditation Hub
</h1>

  <p className="mt-3 text-slate-600">
    ระบบเช็คอินและฐานข้อมูลผู้เข้าร่วมสมาธิ / Meditation Check-in & Member Database System
  </p>
</div>

            <AuthButton />
          </div>

<div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-8">
 <div className="grid gap-8 md:grid-cols-2">
  <div>
    <p className="text-xl font-bold text-slate-700">
  สมาชิกทั้งหมด / Total Members
</p>

    <h2 className="mt-2 text-6xl font-bold text-blue-700">
      {totalMembers}
    </h2>

    <p className="mt-2 text-xl font-bold text-blue-700">
  คน
</p>
  </div>

  <div className="md:text-right">
    <p className="text-xl font-bold text-slate-700">
  เช็คอินสะสมทั้งหมด / All-Time Check-ins
</p>

    <h2 className="mt-2 text-7xl font-bold text-green-600">
      {totalCheckinsAllTime}
    </h2>

    <p className="mt-2 text-lg font-bold text-green-700">
  ครั้ง
</p>
  </div>
  </div>
</div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatCard
    title="เช็คอินวันนี้ / Today Check-ins"
    value={totalCheckinsToday}
  />

  <StatCard
    title="เช็คอินเดือนนี้ / Monthly Check-ins"
    value={totalCheckinsThisMonth}
  />

  <StatCard
    title="Sessions ทั้งหมด / Total Sessions"
    value={totalSessions}
  />
  
</div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a href="/checkin" className="lg:col-span-2">
  <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 p-8 text-white shadow-lg hover:bg-green-700 transition">
    <h2 className="text-5xl font-bold">
      ✓ Check-in
    </h2>

    <p className="mt-2 text-xl">
      เช็คอินสมาชิก
    </p>

    <p className="mt-2 text-green-100">
      คลิกเพื่อเช็คอินสมาชิกทันที
    </p>
  </div>
</a>

            <a href="/checkin/scan">
              <Card title="QR Scanner" subtitle="สแกน QR เช็คอิน" />
            </a>

            <a href="/sessions">
              <Card title="Sessions" subtitle="จัดการรอบกิจกรรม" />
            </a>

            <a href="/reports">
              <Card title="Analytics Report" subtitle="กราฟการเข้าร่วม" />
            </a>

            <a href="/attendance">
              <Card title="Attendance Report" subtitle="รายงานการเข้าร่วม" />
            </a>

            <a href="/register">
              <Card title="New Registration" subtitle="ลงทะเบียนสมาชิกใหม่" />
            </a>

            <a href="/members">
              <Card title="Members" subtitle="ฐานข้อมูลสมาชิก" />
            </a>

            <a href="/import">
              <Card title="Import Excel" subtitle="นำเข้าข้อมูลเก่า" />
            </a>

            <a href="/export">
              <Card title="Export Excel" subtitle="ส่งออกข้อมูลสมาชิก" />
            </a>

            <Card title="Admin Panel" subtitle="ระบบผู้ดูแล" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Top 10 Most Active Members
              </h2>

               {mostActiveMember && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="text-sm text-gray-600">
                สมาชิกที่มาบ่อยที่สุด / Most Active Member
              </p>

              <div className="mt-3 flex items-center gap-4">
                {mostActiveMember.member?.profile_photo_url ? (
                  <img
                    src={mostActiveMember.member.profile_photo_url}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl">
                    🙏
                  </div>
                )}

                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {mostActiveMember.member?.full_name || "-"}
                  </p>
                  <p className="text-gray-600">
                    เข้าร่วมทั้งหมด {mostActiveMember.count} ครั้ง
                  </p>
                </div>
              </div>
            </div>
          )}

              <div className="mt-4 space-y-3">
                {topMembers.map((item: any, index: number) => (
                  <div
                    key={item.member.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                        {index + 1}
                      </div>

                      {item.member.profile_photo_url ? (
                        <img
                          src={item.member.profile_photo_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm">
                          🙏
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-slate-900">
                          {item.member.full_name || "-"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {item.member.phone || item.member.email || "-"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}

                {topMembers.length === 0 && (
                  <p className="text-gray-500">
                    ยังไม่มีข้อมูลการเข้าร่วม / No attendance yet
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                สมาชิกใหม่ล่าสุด / Latest Members
              </h2>

              <div className="mt-4 space-y-3">
                {latestMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm">
                        -
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-slate-900">
                        {member.full_name || "-"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {member.phone || member.email || "-"}
                      </p>
                    </div>
                  </div>
                ))}

                {latestMembers.length === 0 && (
                  <p className="text-gray-500">ยังไม่มีสมาชิก / No members yet</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Sessions ล่าสุด / Latest Sessions
              </h2>

              <div className="mt-4 space-y-3">
                {latestSessions.map((session) => (
                  <div key={session.id} className="border-b border-slate-100 pb-3">
                    <p className="font-medium text-slate-900">
                      {session.session_name || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {session.event_date || "-"} · {session.start_time || "-"} - {session.end_time || "-"}
                    </p>
                    <p className="mt-2 text-xl font-bold text-green-700">
  ครั้ง
</p>
                  </div>
                ))}

                {latestSessions.length === 0 && (
                  <p className="text-gray-500">ยังไม่มี Session / No sessions yet</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
  <h2 className="text-xl font-semibold text-slate-900">
    System Summary
  </h2>

  <div className="mt-6 space-y-4">
    <div className="flex justify-between">
      <span>Members</span>
      <span className="font-bold">{totalMembers}</span>
    </div>

    <div className="flex justify-between">
      <span>Sessions</span>
      <span className="font-bold">{totalSessions}</span>
    </div>

    <div className="flex justify-between">
      <span>Check-ins</span>
      <span className="font-bold">{totalCheckinsAllTime}</span>
    </div>

    <div className="flex justify-between">
      <span>Unique Participants</span>
      <span className="font-bold">{uniqueParticipants}</span>
    </div>

    <div className="flex justify-between">
      <span>New Members This Month</span>
      <span className="font-bold">{newMembersThisMonth}</span>
    </div>

    <div className="flex justify-between">
      <span>Members With Photo</span>
      <span className="font-bold">{membersWithPhoto}</span>
    </div>

    <div className="border-t pt-4">
      <p className="text-sm text-slate-500">
        Average Attendance / Session
      </p>

      <p className="text-3xl font-bold text-green-600">
        {totalSessions > 0
          ? (totalCheckinsAllTime / totalSessions).toFixed(1)
          : 0}
      </p>
    </div>
  </div>
</section>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-600">{subtitle}</p>
    </div>
  );
}