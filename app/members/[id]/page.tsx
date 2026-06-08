import { supabase } from "@/lib/supabase";
import DeleteButton from "./DeleteButton";

export default async function MemberDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("member_id", id)
    .order("checkin_time", { ascending: false });

  if (error || !member) {
    return <div>ไม่พบสมาชิก</div>;
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          รายละเอียดสมาชิก / Member Detail
        </h1>

        {member.profile_photo_url && (
          <img
            src={member.profile_photo_url}
            alt="Profile Photo"
            className="mt-6 h-40 w-40 rounded-full border object-cover"
          />
        )}

        <div className="mt-6 flex gap-3">
          <a
            href={`/members/${member.id}/edit`}
            className="rounded-xl bg-green-700 px-6 py-3 text-white"
          >
            แก้ไขข้อมูล / Edit
          </a>

          <DeleteButton memberId={member.id} />
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border p-6">
          <p><strong>ชื่อ / Name:</strong> {member.full_name}</p>
          <p><strong>ชื่อเล่น / Nickname:</strong> {member.nickname}</p>
          <p><strong>เพศ / Gender:</strong> {member.gender}</p>
          <p><strong>วันเกิด / Birth Date:</strong> {member.birth_date}</p>
          <p><strong>อายุ / Age:</strong> {member.age}</p>
          <p><strong>โทร / Phone:</strong> {member.phone}</p>
          <p><strong>อีเมล / Email:</strong> {member.email}</p>
          <p><strong>Line ID:</strong> {member.line_id}</p>
          <p><strong>อาชีพ / Occupation:</strong> {member.occupation}</p>
          <p><strong>รู้จักเราจาก / Referral:</strong> {member.referral_source}</p>
          <p><strong>รูปแบบการนั่ง / Sitting:</strong> {member.sitting_preference}</p>
          <p><strong>สมาธิที่ชอบ / Meditation:</strong> {member.meditation_preference}</p>
          <p><strong>ยินยอมถ่ายภาพ / Photo Consent:</strong> {member.photo_consent}</p>
          <p><strong>ที่อยู่ / Address:</strong> {member.address}</p>
          <p><strong>หมายเหตุ / Notes:</strong> {member.notes}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
          <h2 className="text-2xl font-bold text-[#4b5f4a]">
            ประวัติการเข้าร่วม / Attendance History
          </h2>

          <p className="mt-2 text-gray-600">
            จำนวนครั้งทั้งหมด / Total Attendance: {checkins?.length || 0}
          </p>

          <div className="mt-4 space-y-3">
            {checkins?.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-white p-4"
              >
                <p className="font-semibold text-[#4b5f4a]">
                  {item.session_name || "Meditation Session"}
                </p>

                <p className="text-sm text-gray-600">
                  วันที่ / Date: {item.checkin_date}
                </p>

                <p className="text-sm text-gray-600">
                  เวลา / Time:{" "}
                  {new Date(item.checkin_time).toLocaleTimeString()}
                </p>
              </div>
            ))}

            {(!checkins || checkins.length === 0) && (
              <p className="text-gray-500">
                ยังไม่มีประวัติการเข้าร่วม / No attendance history yet
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}