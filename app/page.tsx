import { supabase } from "@/lib/supabase";
import AttendanceChart from "./components/AttendanceChart";

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

  const attendanceByMonth: Record<string, number> = {};

  (monthCheckins || []).forEach((item) => {
    if (!item.checkin_date) return;

    const month = item.checkin_date.slice(0, 7);

    attendanceByMonth[month] = (attendanceByMonth[month] || 0) + 1;
  });

  const chartData = Object.entries(attendanceByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-8 shadow-md">
          <h1 className="text-4xl font-bold text-[#4b5f4a]">
            Dunedin Meditation Hub
          </h1>

          <p className="mt-3 text-gray-600">
            ระบบเช็คอินและฐานข้อมูลผู้เข้าร่วมนั่งสมาธิ / Meditation Check-in & Member Database System
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="สมาชิกทั้งหมด / Total Members" value={totalMembers} />
            <StatCard title="สมาชิกใหม่เดือนนี้ / New This Month" value={newMembersThisMonth} />
            <StatCard title="เช็คอินวันนี้ / Today Check-ins" value={totalCheckinsToday} />
            <StatCard title="เช็คอินเดือนนี้ / Monthly Check-ins" value={totalCheckinsThisMonth} />
            <StatCard title="Sessions ทั้งหมด / Total Sessions" value={totalSessions} />
            <StatCard title="มีรูปโปรไฟล์ / With Photo" value={membersWithPhoto} />
            <StatCard title="ผู้ที่เคยมา / Active Members" value={topMembers.length} />
            <StatCard
              title="มามากที่สุด / Top Attendance"
              value={mostActiveMember?.count || 0}
            />
          </div>

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
                  <p className="text-2xl font-bold text-[#4b5f4a]">
                    {mostActiveMember.member?.full_name || "-"}
                  </p>
                  <p className="text-gray-600">
                    เข้าร่วมทั้งหมด {mostActiveMember.count} ครั้ง
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a href="/checkin">
              <Card title="Check-in" subtitle="เช็คอินสมาชิก" />
            </a>
            <a href="/checkin/scan">
  <Card title="QR Scanner" subtitle="สแกน QR เช็คอิน" />
</a>

            <a href="/sessions">
              <Card title="Sessions" subtitle="จัดการรอบกิจกรรม" />
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
            <section className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
              <h2 className="text-xl font-semibold text-[#4b5f4a]">
                Top 10 Most Active Members
              </h2>

              <div className="mt-4 space-y-3">
                {topMembers.map((item: any, index: number) => (
                  <div
                    key={item.member.id}
                    className="flex items-center justify-between border-b pb-3"
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5dfcf] text-sm">
                          🙏
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-[#4b5f4a]">
                          {item.member.full_name || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
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

            <section className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
              <h2 className="text-xl font-semibold text-[#4b5f4a]">
                สมาชิกใหม่ล่าสุด / Latest Members
              </h2>

              <div className="mt-4 space-y-3">
                {latestMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 border-b pb-3">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5dfcf] text-sm">
                        -
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-[#4b5f4a]">
                        {member.full_name || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
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

            <section className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
              <h2 className="text-xl font-semibold text-[#4b5f4a]">
                Sessions ล่าสุด / Latest Sessions
              </h2>

              <div className="mt-4 space-y-3">
                {latestSessions.map((session) => (
                  <div key={session.id} className="border-b pb-3">
                    <p className="font-medium text-[#4b5f4a]">
                      {session.session_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.event_date || "-"} · {session.start_time || "-"} - {session.end_time || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.location || "-"}
                    </p>
                  </div>
                ))}

                {latestSessions.length === 0 && (
                  <p className="text-gray-500">ยังไม่มี Session / No sessions yet</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
              <h2 className="text-xl font-semibold text-[#4b5f4a]">
                Attendance Trend
              </h2>

              <p className="mt-2 text-gray-600">
                จำนวนการเช็คอินรายเดือน
              </p>

              <div className="mt-6">
                <AttendanceChart data={chartData} />
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-5 shadow-sm">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="mt-2 text-4xl font-bold text-[#4b5f4a]">{value}</p>
    </div>
  );
}

function Card({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="h-full rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6 shadow-sm hover:shadow-md">
      <h2 className="text-xl font-semibold text-[#4b5f4a]">{title}</h2>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  );
}