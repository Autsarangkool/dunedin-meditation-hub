"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AttendancePage() {
  const [members, setMembers] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*");

    if (memberError) {
      alert(memberError.message);
      return;
    }

    const { data: checkinData, error: checkinError } = await supabase
      .from("checkins")
      .select("*, sessions(*)")
      .order("checkin_time", { ascending: false });

    if (checkinError) {
      alert(checkinError.message);
      return;
    }

    setMembers(memberData || []);
    setCheckins(checkinData || []);
  }

  function getMemberStats(member: any) {
    const memberCheckins = checkins.filter(
      (item) => item.member_id === member.id
    );

    const latestCheckin = memberCheckins[0];

    return {
      total: memberCheckins.length,
      latestDate: latestCheckin?.checkin_date || "-",
      latestSession:
        latestCheckin?.sessions?.session_name ||
        latestCheckin?.session_name ||
        "-",
    };
  }

  const reportRows = members
    .map((member) => {
      const stats = getMemberStats(member);

      return {
        ...member,
        totalAttendances: stats.total,
        latestDate: stats.latestDate,
        latestSession: stats.latestSession,
      };
    })
    .filter((member) => {
      const keyword = search.toLowerCase();

      return (
        member.full_name?.toLowerCase().includes(keyword) ||
        member.nickname?.toLowerCase().includes(keyword) ||
        member.phone?.toLowerCase().includes(keyword) ||
        member.email?.toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => b.totalAttendances - a.totalAttendances);

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#4b5f4a]">
              รายงานการเข้าร่วม / Attendance Report
            </h1>

            <p className="mt-2 text-gray-600">
              สรุปจำนวนครั้งที่สมาชิกแต่ละคนเข้าร่วม
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border px-5 py-3 font-semibold text-[#4b5f4a]"
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-[#fffdf8] p-5">
            <p className="text-gray-600">สมาชิกทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-[#4b5f4a]">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-[#fffdf8] p-5">
            <p className="text-gray-600">เช็คอินทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold text-[#4b5f4a]">
              {checkins.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-[#fffdf8] p-5">
            <p className="text-gray-600">สมาชิกที่เคยมา</p>
            <p className="mt-2 text-3xl font-bold text-[#4b5f4a]">
              {reportRows.filter((member) => member.totalAttendances > 0).length}
            </p>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล"
          className="mt-6 w-full rounded-xl border p-3"
        />

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-[#f7f3ea]">
                <th className="p-3">อันดับ</th>
                <th className="p-3">สมาชิก</th>
                <th className="p-3">ชื่อเล่น</th>
                <th className="p-3">จำนวนครั้ง</th>
                <th className="p-3">มาล่าสุด</th>
                <th className="p-3">Session ล่าสุด</th>
                <th className="p-3">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {reportRows.map((member, index) => (
                <tr key={member.id} className="border-b">
                  <td className="p-3">{index + 1}</td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img
                          src={member.profile_photo_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                          🙏
                        </div>
                      )}

                      <span className="font-semibold">
                        {member.full_name || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">{member.nickname || "-"}</td>

                  <td className="p-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                      {member.totalAttendances} ครั้ง
                    </span>
                  </td>

                  <td className="p-3">{member.latestDate}</td>
                  <td className="p-3">{member.latestSession}</td>

                  <td className="p-3">
                    <Link
                      href={`/members/${member.id}`}
                      className="rounded-lg bg-green-700 px-3 py-2 text-white"
                    >
                      ดูข้อมูล
                    </Link>
                  </td>
                </tr>
              ))}

              {reportRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}