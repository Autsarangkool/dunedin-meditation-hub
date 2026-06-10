import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteButton from "./DeleteButton";
import QRCodeCard from "./QRCodeCard";
import MemberCardDownload from "./MemberCardDownload";

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
    .select("*, sessions(*)")
    .eq("member_id", id)
    .order("checkin_time", { ascending: false });

  if (error || !member) {
    return <div>ไม่พบสมาชิก</div>;
  }

  const totalAttendances = checkins?.length || 0;
  const latestCheckin = checkins?.[0];

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#4b5f4a]">
              รายละเอียดสมาชิก / Member Detail
            </h1>

            <p className="mt-2 text-gray-600">
              ดูข้อมูลสมาชิกและประวัติการเข้าร่วม
            </p>
          </div>

          <Link
            href="/members"
            className="rounded-xl border px-5 py-3 font-semibold text-[#4b5f4a]"
          >
            ← กลับรายชื่อ
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center rounded-2xl border bg-[#fffdf8] p-6 md:w-64">
            {member.profile_photo_url ? (
              <img
                src={member.profile_photo_url}
                alt="Profile Photo"
                className="h-40 w-40 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border bg-gray-100 text-6xl">
                🙏
              </div>
            )}

            <h2 className="mt-4 text-center text-xl font-bold">
              {member.full_name || "-"}
            </h2>

            <p className="text-gray-500">{member.nickname || "-"}</p>

            <div className="mt-5 grid w-full grid-cols-1 gap-3 text-center">
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-500">มาทั้งหมด</p>
                <p className="text-3xl font-bold text-green-700">
                  {totalAttendances}
                </p>
                <p className="text-sm text-gray-500">ครั้ง</p>
              </div>

              <div className="rounded-xl bg-[#f7f3ea] p-4">
                <p className="text-sm text-gray-500">มาล่าสุด</p>
                <p className="mt-1 font-semibold text-[#4b5f4a]">
                  {latestCheckin?.checkin_date || "-"}
                </p>
              </div>
            </div>
            <QRCodeCard
  memberId={member.id}
  memberName={member.full_name || "-"}
/>


<MemberCardDownload member={member} />

            <div className="mt-5 flex w-full flex-col gap-3">
              <Link
                href={`/members/${member.id}/edit`}
                className="rounded-xl bg-green-700 px-6 py-3 text-center text-white"
              >
                แก้ไขข้อมูล / Edit
              </Link>

              <DeleteButton memberId={member.id} />
            </div>
          </div>

          <div className="flex-1 space-y-3 rounded-2xl border p-6">
            <p>
              <strong>ชื่อ / Name:</strong> {member.full_name || "-"}
            </p>
            <p>
              <strong>ชื่อเล่น / Nickname:</strong> {member.nickname || "-"}
            </p>
            <p>
              <strong>เพศ / Gender:</strong> {member.gender || "-"}
            </p>
            <p>
              <strong>วันเกิด / Birth Date:</strong> {member.birth_date || "-"}
            </p>
            <p>
              <strong>อายุ / Age:</strong> {member.age || "-"}
            </p>
            <p>
              <strong>โทร / Phone:</strong> {member.phone || "-"}
            </p>
            <p>
              <strong>อีเมล / Email:</strong> {member.email || "-"}
            </p>
            <p>
              <strong>Line ID:</strong> {member.line_id || "-"}
            </p>
            <p>
              <strong>อาชีพ / Occupation:</strong>{" "}
              {member.occupation || "-"}
            </p>
            <p>
              <strong>รู้จักเราจาก / Referral:</strong>{" "}
              {member.referral_source || "-"}
            </p>
            <p>
              <strong>รูปแบบการนั่ง / Sitting:</strong>{" "}
              {member.sitting_preference || "-"}
            </p>
            <p>
              <strong>สมาธิที่ชอบ / Meditation:</strong>{" "}
              {member.meditation_preference || "-"}
            </p>
            <p>
              <strong>สุขภาพ / Health Concern:</strong>{" "}
              {member.health_concern || "-"}
            </p>
            <p>
              <strong>ยินยอมถ่ายภาพ / Photo Consent:</strong>{" "}
              {member.photo_consent || "-"}
            </p>
            <p>
              <strong>ที่อยู่ / Address:</strong> {member.address || "-"}
            </p>
            <p>
              <strong>หมายเหตุ / Notes:</strong> {member.notes || "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
          <h2 className="text-2xl font-bold text-[#4b5f4a]">
            ประวัติการเข้าร่วม / Attendance History
          </h2>

          <p className="mt-2 text-gray-600">
            จำนวนครั้งทั้งหมด / Total Attendance: {totalAttendances}
          </p>

          <div className="mt-4 space-y-3">
            {checkins?.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-[#4b5f4a]">
                      {item.sessions?.session_name ||
                        item.session_name ||
                        "Meditation Session"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {item.sessions?.session_number || "-"} ·{" "}
                      {item.sessions?.event_date ||
                        item.checkin_date ||
                        "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      เวลา / Time:{" "}
                      {item.checkin_time
                        ? new Date(item.checkin_time).toLocaleTimeString()
                        : "-"}
                    </p>
                  </div>
                </div>

                {item.session_id && (
                  <Link
                    href={`/sessions/${item.session_id}`}
                    className="rounded-lg bg-green-700 px-4 py-2 text-white"
                  >
                    ดูรุ่น
                  </Link>
                )}
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