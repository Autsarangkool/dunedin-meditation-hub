"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QRCheckinPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [totalVisits, setTotalVisits] = useState(0);
  const [status, setStatus] = useState("กำลังเช็คอิน...");

  useEffect(() => {
    if (memberId) {
      checkinByQR();
    }
  }, [memberId]);

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  async function checkinByQR() {
    const today = getToday();

    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    if (memberError || !memberData) {
      setStatus("ไม่พบสมาชิก");
      return;
    }

    setMember(memberData);

    const { data: latestSession, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !latestSession) {
      setStatus("ยังไม่มี Session ให้เช็คอิน");
      return;
    }

    setSession(latestSession);

    const { data: existing } = await supabase
      .from("checkins")
      .select("*")
      .eq("member_id", memberId)
      .eq("session_id", latestSession.id)
      .maybeSingle();

    if (existing) {
      setStatus("เช็คอิน Session นี้แล้ว");
    } else {
      const { error } = await supabase.from("checkins").insert({
        member_id: memberId,
        session_id: latestSession.id,
        session_name: latestSession.session_name,
        checkin_date: today,
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setStatus("เช็คอินสำเร็จ");
    }

    const { count } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", memberId);

    setTotalVisits(count || 0);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ea] p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">QR Check-in</h1>

        <div className="mt-8 rounded-3xl border bg-green-50 p-8">
          <div className="text-6xl">
            {status === "เช็คอินสำเร็จ" ? "✅" : "🙏"}
          </div>

          {member?.profile_photo_url && (
            <img
              src={member.profile_photo_url}
              alt=""
              className="mx-auto mt-6 h-40 w-40 rounded-full border-4 border-green-300 object-cover"
            />
          )}

          <h2 className="mt-6 text-3xl font-bold">
            {member?.full_name || "-"}
          </h2>

          <p className="mt-2 text-xl text-gray-600">
            {member?.nickname || member?.phone || ""}
          </p>

          <p className="mt-6 text-2xl font-semibold text-green-700">
            {status}
          </p>

          {session && (
            <p className="mt-3 text-gray-600">
              {session.session_name}{" "}
              {session.session_number ? `(${session.session_number})` : ""}
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-white p-5">
            <p className="text-gray-500">มาทั้งหมด / Total Attendances</p>
            <p className="mt-2 text-4xl font-bold text-green-700">
              {totalVisits} ครั้ง
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/checkin" className="rounded-xl bg-green-700 px-5 py-3 text-white">
            กลับหน้า Check-in
          </Link>

          <Link href="/members" className="rounded-xl border px-5 py-3">
            Members
          </Link>
        </div>
      </div>
    </main>
  );
}