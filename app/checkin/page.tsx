"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CheckinPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [search, setSearch] = useState("");
  const [latestCheckin, setLatestCheckin] = useState<any>(null);

  useEffect(() => {
    loadMembers();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadTodayCheckins();
    }
  }, [selectedSessionId]);

  function getToday() {
    return new Date().toISOString().split("T")[0];
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

    if (data && data.length > 0) {
      setSelectedSessionId(data[0].id);
    }
  }

  async function loadTodayCheckins() {
    const today = getToday();

    const { data } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .eq("checkin_date", today)
      .eq("session_id", selectedSessionId)
      .order("checkin_time", { ascending: false });

    setTodayCheckins(data || []);

    if (data && data.length > 0) {
      setLatestCheckin(data[0]);
    }
  }

  function alreadyCheckedIn(memberId: string) {
    return todayCheckins.some((item) => item.member_id === memberId);
  }

  function selectedSession() {
    return sessions.find((session) => session.id === selectedSessionId);
  }

  async function handleCheckin(member: any) {
    const session = selectedSession();

    if (!session) {
      alert("กรุณาเลือก Session ก่อน / Please select a session first");
      return;
    }

    if (alreadyCheckedIn(member.id)) {
      alert("สมาชิกคนนี้เช็คอิน Session นี้แล้ว / Already checked in this session");
      return;
    }

    const { data, error } = await supabase
      .from("checkins")
      .insert({
        member_id: member.id,
        session_id: session.id,
        session_name: session.session_name,
        checkin_date: getToday(),
      })
      .select("*, members(*), sessions(*)")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setLatestCheckin(data);
    await loadTodayCheckins();
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
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          เช็คอินสมาชิก / Member Check-in
        </h1>

        <p className="mt-2 text-gray-600">
          เลือก Session แล้วค้นหาสมาชิกเพื่อเช็คอิน / Select a session and check in members
        </p>

        <div className="mt-6 rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-5">
          <label className="font-semibold text-[#4b5f4a]">
            เลือก Session / Select Session
          </label>

          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="mt-3 w-full rounded-xl border p-3"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.session_name}{" "}
                {session.session_number ? `(${session.session_number})` : ""} -{" "}
                {session.event_date || ""}
              </option>
            ))}
          </select>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/sessions"
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              + สร้างรุ่นใหม่ / Create New Session
            </Link>

            <Link
              href="/checkin/manual"
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              + เพิ่มเช็คอินย้อนหลัง
            </Link>

            <button
              onClick={loadSessions}
              className="rounded-xl border px-5 py-3 font-semibold text-[#4b5f4a] hover:bg-[#f7f3ea]"
            >
              โหลด Session ใหม่ / Refresh
            </button>
          </div>

          {sessions.length === 0 && (
            <p className="mt-3 text-sm text-red-600">
              ยังไม่มี Session กรุณาสร้างที่หน้า /sessions ก่อน
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-semibold text-[#4b5f4a]">
              รายชื่อสมาชิก / Members
            </h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล / Search name, nickname, phone or email"
              className="mt-4 w-full rounded-xl border p-3"
            />

            <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto pr-2">
              {filteredMembers.map((member) => {
                const checked = alreadyCheckedIn(member.id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img
                          src={member.profile_photo_url}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl">
                          🙏
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">{member.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {member.nickname || member.phone || "-"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckin(member)}
                      disabled={checked || !selectedSessionId}
                      className={
                        checked || !selectedSessionId
                          ? "rounded-lg bg-gray-300 px-4 py-2 text-gray-600"
                          : "rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                      }
                    >
                      {checked ? "เช็คอินแล้ว" : "Check-in"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
            <h2 className="text-xl font-semibold text-[#4b5f4a]">
              เช็คอินล่าสุด / Latest Check-in
            </h2>

            {latestCheckin ? (
              <div className="mt-4 rounded-3xl border border-green-200 bg-green-50 p-8 text-center shadow-lg">
                <div className="mb-3 text-6xl">✅</div>

                <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-green-300 bg-white">
                  {latestCheckin.members?.profile_photo_url ? (
                    <img
                      src={latestCheckin.members.profile_photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl">
                      🙏
                    </div>
                  )}
                </div>

                <h3 className="text-3xl font-bold text-gray-900">
                  {latestCheckin.members?.full_name || "-"}
                </h3>

                <p className="mt-2 text-xl text-gray-600">
                  {latestCheckin.members?.nickname ||
                    latestCheckin.members?.phone ||
                    ""}
                </p>

                <p className="mt-5 text-2xl font-semibold text-green-700">
                  เช็คอินสำเร็จ / Check-in Successful
                </p>

                <p className="mt-3 text-lg text-gray-600">
                  {latestCheckin.sessions?.session_name ||
                    latestCheckin.session_name}
                </p>

                <p className="mt-1 text-gray-500">
                  {latestCheckin.checkin_time
                    ? new Date(latestCheckin.checkin_time).toLocaleTimeString()
                    : ""}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border bg-white p-8 text-center text-gray-500">
                <div className="mb-3 text-6xl">🙏</div>
                <p className="text-xl font-semibold">รอการเช็คอินล่าสุด</p>
                <p className="mt-1">เมื่อเช็คอินสำเร็จ จะแสดงตรงนี้แบบใหญ่</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-[#4b5f4a]">
                รายชื่อที่เช็คอินแล้ว / Session Check-ins
              </h3>

              <p className="mt-1 text-gray-600">
                รวมทั้งหมด / Total: {todayCheckins.length} คน
              </p>

              <div className="mt-4 max-h-[260px] space-y-3 overflow-y-auto">
                {todayCheckins.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3"
                  >
                    {item.members?.profile_photo_url ? (
                      <img
                        src={item.members.profile_photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                        🙏
                      </div>
                    )}

                    <div>
                      <p className="font-medium">
                        {item.members?.full_name || "-"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.sessions?.session_name || item.session_name} •{" "}
                        {item.checkin_time
                          ? new Date(item.checkin_time).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}

                {todayCheckins.length === 0 && (
                  <p className="text-gray-500">
                    ยังไม่มีคนเช็คอิน Session นี้ / No check-ins for this session
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}