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
  const [latestFiveCheckins, setLatestFiveCheckins] = useState<any[]>([]);

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
    .eq("is_deleted", false)
    .order("full_name");

  setMembers(data || []);
}

  async function loadSessions() {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setSessions(data || []);

    if (data && data.length > 0) {
      setSelectedSessionId(data[0].id);
    }
  }

  async function loadTodayCheckins() {
    if (!selectedSessionId) return;

    const today = getToday();

    const { data, error } = await supabase
      .from("checkins")
      .select("*, members(*), sessions(*)")
      .eq("checkin_date", today)
      .eq("session_id", selectedSessionId)
      .order("checkin_time", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setTodayCheckins(data || []);
    setLatestFiveCheckins((data || []).slice(0, 5));

    if (data && data.length > 0) {
      const latest = data[0];

      const { count } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("member_id", latest.member_id);

      setLatestCheckin({
        ...latest,
        totalVisits: count || 0,
      });
    } else {
      setLatestCheckin(null);
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
  .upsert(
    {
      member_id: member.id,
      session_id: session.id,
      session_name: session.session_name,
      checkin_date: getToday(),
    },
    {
      onConflict: "member_id,session_id",
    }
  )
  .select("*, members(*), sessions(*)")
  .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { count } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id);

    setLatestCheckin({
      ...data,
      totalVisits: count || 0,
    });

    await loadTodayCheckins();
    setSearch("");
  }

  async function handleDeleteCheckin(checkinId: string) {
    const confirmDelete = window.confirm(
      "ต้องการลบ Check-in นี้หรือไม่? / Delete this check-in?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("id", checkinId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTodayCheckins();
    alert("ลบ Check-in เรียบร้อย / Check-in deleted");
  }

  const filteredMembers = members.filter((member) =>
    `${member.full_name || ""} ${member.nickname || ""} ${member.phone || ""} ${
      member.email || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const shouldShowMembers = search.trim() !== "";

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <a
          href="/"
          className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
        >
          🏠 กลับหน้าหลัก
        </a>

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

            <div className="relative mt-4">
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล / Search name, nickname, phone or email"
    className="w-full rounded-xl border p-3"
  />

  {search.trim() !== "" && filteredMembers.length > 0 && (
    <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
      {filteredMembers.slice(0, 10).map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between border-b p-3 hover:bg-gray-50"
        >
          <div>
            <div className="font-semibold">{member.full_name}</div>
            <div className="text-sm text-gray-500">
              {member.nickname || member.phone || "-"}
            </div>
          </div>

          <button
            onClick={() => handleCheckin(member)}
            className="rounded-lg bg-green-700 px-3 py-2 text-white"
          >
            Check-in
          </button>
        </div>
      ))}
    </div>
  )}
</div>

            <div className="mt-4 rounded-2xl border bg-[#fffdf8] p-5">
  <h3 className="font-semibold text-[#4b5f4a]">
    เช็คอินล่าสุด 5 คน
  </h3>

  <div className="mt-4 space-y-3">
    {latestFiveCheckins.length > 0 ? (
      latestFiveCheckins.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
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
              <p className="font-semibold text-slate-900">
                {item.members?.full_name || "-"}
              </p>
              <p className="text-sm text-gray-500">
                {item.members?.nickname || "-"}
              </p>
            </div>
          </div>

          <span className="text-sm font-semibold text-green-700">✓</span>
        </div>
      ))
    ) : (
      <p className="text-center text-gray-500">
        ยังไม่มีเช็คอินใน Session นี้
      </p>
    )}
  </div>
</div>

            {shouldShowMembers && search.trim() === "" && (
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

                {filteredMembers.length === 0 && (
  <div className="rounded-2xl border bg-[#fffdf8] p-5">
    <h3 className="font-semibold text-[#4b5f4a]">
      เช็คอินล่าสุด 5 คน
    </h3>

    <div className="mt-4 space-y-3">
      {latestFiveCheckins.length > 0 ? (
        latestFiveCheckins.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
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
                <p className="font-semibold text-slate-900">
                  {item.members?.full_name || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  {item.members?.nickname || "-"}
                </p>
              </div>
            </div>

            <span className="text-sm font-semibold text-green-700">
              ✓
            </span>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">
          ยังไม่มีเช็คอินใน Session นี้
        </p>
      )}
    </div>
  </div>
)}
              </div>
            )}
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

                <div className="mt-6 rounded-2xl border border-green-200 bg-white p-4">
                  <p className="text-sm text-gray-500">
                    มาทั้งหมด / Total Attendances
                  </p>
                  <p className="mt-1 text-3xl font-bold text-green-700">
                    {latestCheckin.totalVisits || 0} ครั้ง
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border bg-white p-8 text-center text-gray-500">
                <div className="mb-3 text-6xl">🙏</div>
                <p className="text-xl font-semibold">รอการเช็คอินล่าสุด</p>
                <p className="mt-1">เมื่อเช็คอินสำเร็จ จะแสดงตรงนี้แบบใหญ่</p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-[#e5dfcf] bg-[#fffdf8] p-6">
          <h2 className="text-xl font-semibold text-[#4b5f4a]">
            รายการเช็คอินวันนี้ / Today&apos;s Check-ins
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">สมาชิก / Member</th>
                  <th className="p-3 text-left">เวลา / Time</th>
                  <th className="p-3 text-left">Session</th>
                  <th className="p-3 text-center">จัดการ / Action</th>
                </tr>
              </thead>

              <tbody>
                {todayCheckins.map((checkin) => (
                  <tr key={checkin.id} className="border-b">
                    <td className="p-3">
                      {checkin.members?.full_name || "-"}
                    </td>

                    <td className="p-3">
                      {checkin.checkin_time
                        ? new Date(checkin.checkin_time).toLocaleTimeString()
                        : "-"}
                    </td>

                    <td className="p-3">
                      {checkin.sessions?.session_name ||
                        checkin.session_name ||
                        "-"}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteCheckin(checkin.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {todayCheckins.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center text-gray-500"
                    >
                      ยังไม่มี Check-in วันนี้ / No check-ins today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}