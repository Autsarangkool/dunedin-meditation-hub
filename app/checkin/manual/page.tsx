"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ManualCheckinPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [checkinDate, setCheckinDate] = useState(getToday());
  const [checkinTime, setCheckinTime] = useState(getNowTime());

  const showHistory = false;

  useEffect(() => {
    loadMembers();
    loadSessions();
    loadCheckins();
  }, []);

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  function getNowTime() {
    return new Date().toTimeString().slice(0, 5);
  }

  async function loadMembers() {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("full_name");

    setMembers(data || []);
  }

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    setSessions(data || []);

    if (data?.length) {
      setSelectedSessionId(data[0].id);
    }
  }

  async function loadCheckins() {
    const { data } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .order("checkin_time", { ascending: false });

    setCheckins(data || []);
  }

  async function addManualCheckin() {
    if (!selectedMemberId) {
      alert("กรุณาเลือกสมาชิก");
      return;
    }

    const checkinDateTime = `${checkinDate}T${checkinTime}:00`;
    const session = sessions.find((s) => s.id === selectedSessionId);

    const { error } = await supabase.from("checkins").insert({
      member_id: selectedMemberId,
      session_id: selectedSessionId || null,
      session_name: session?.session_name || "Manual Check-in",
      checkin_date: checkinDate,
      checkin_time: checkinDateTime,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("เพิ่มเช็คอินย้อนหลังสำเร็จ");
    setSelectedMemberId("");
    setCheckinDate(getToday());
    setCheckinTime(getNowTime());
    loadCheckins();
  }

  async function deleteCheckin(id: string) {
    if (!confirm("ต้องการลบรายการเช็คอินนี้ใช่ไหม?")) return;

    const { error } = await supabase.from("checkins").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setCheckins((prev) => prev.filter((item) => item.id !== id));
  }

  const filteredMembers = members.filter((member) =>
    `${member.full_name || ""} ${member.nickname || ""} ${member.phone || ""} ${
      member.email || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#4b5f4a]">
            เพิ่มเช็คอินย้อนหลัง
          </h1>

          <Link
            href="/checkin"
            className="rounded-xl border px-5 py-3 font-semibold text-[#4b5f4a] hover:bg-[#f7f3ea]"
          >
            กลับหน้า Check-in
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border bg-[#fffdf8] p-6">
          <h2 className="text-xl font-semibold text-[#4b5f4a]">
            Manual Backdate Check-in
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสมาชิก"
            className="mt-4 w-full rounded-xl border p-3"
          />

          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="mt-4 w-full rounded-xl border p-3"
          >
            <option value="">เลือกสมาชิก</option>
            {filteredMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} {member.nickname ? `(${member.nickname})` : ""}
              </option>
            ))}
          </select>

          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="mt-4 w-full rounded-xl border p-3"
          >
            <option value="">ไม่ระบุ Session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.session_name} - {session.event_date}
              </option>
            ))}
          </select>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="date"
              value={checkinDate}
              onChange={(e) => setCheckinDate(e.target.value)}
              className="rounded-xl border p-3"
            />

            <input
              type="time"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="rounded-xl border p-3"
            />
          </div>

          <button
            onClick={addManualCheckin}
            className="mt-4 rounded-lg bg-green-700 px-5 py-3 text-white hover:bg-green-800"
          >
            เพิ่มเช็คอินย้อนหลัง
          </button>
        </section>

        {showHistory && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-[#4b5f4a]">
              รายการเช็คอินทั้งหมด
            </h2>

            <div className="mt-4 space-y-3">
              {checkins.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border bg-[#fffdf8] p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {item.members?.full_name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Session:{" "}
                      {item.sessions?.session_name ||
                        item.session_name ||
                        "ไม่ระบุ"}
                    </p>
                    <p className="text-sm text-gray-600">
                      วันที่: {item.checkin_date || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      เวลา:{" "}
                      {item.checkin_time
                        ? new Date(item.checkin_time).toLocaleTimeString()
                        : "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteCheckin(item.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {checkins.length === 0 && (
                <p className="text-gray-500">ยังไม่มีรายการเช็คอิน</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}