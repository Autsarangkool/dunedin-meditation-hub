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
      onConflict: "checkins_member_session_unique",
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
  <main className="min-h-screen bg-gradient-to-br from-[#edf6e8] via-[#f7f3ea] to-[#fff2d8] p-6">
    <div className="mx-auto max-w-5xl space-y-6">

      <section className="rounded-[2rem] bg-white/90 p-8 shadow-2xl ring-1 ring-black/5">
        <a
          href="/"
          className="inline-block rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          🏠 กลับหน้าหลัก
        </a>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Dunedin Meditation Hub
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-tight text-[#3f573f]">
              🙏 Member Check-in
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              ค้นหาสมาชิก แล้วเช็คอินก่อนเริ่มปฏิบัติธรรม
            </p>
          </div>

          <div className="rounded-3xl bg-[#f7f3ea] p-5 text-right shadow-inner">
            <p className="text-sm text-gray-500">Session ปัจจุบัน</p>
            <p className="text-2xl font-black text-[#4b5f4a]">
              {selectedSession()?.session_name || "-"}
            </p>
            <p className="text-sm text-gray-500">
              {selectedSession()?.session_number || ""} •{" "}
              {selectedSession()?.event_date || ""}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <label className="font-bold text-[#4b5f4a]">
          เลือก Session / Select Session
        </label>

        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="mt-3 w-full rounded-2xl border-2 border-[#dfe6da] bg-white p-4 text-lg font-semibold focus:border-emerald-500 focus:outline-none"
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
            + สร้างรุ่นใหม่
          </Link>

          <Link
            href="/checkin/manual"
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            + เช็คอินย้อนหลัง
          </Link>

          <button
            onClick={loadSessions}
            className="rounded-xl border px-5 py-3 font-semibold text-[#4b5f4a] hover:bg-[#f7f3ea]"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <p className="text-2xl font-black text-[#4b5f4a]">
          🔍 ค้นหาสมาชิกเพื่อเช็คอิน
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="พิมพ์ชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล"
          className="mt-4 w-full rounded-3xl border-2 border-[#dfe6da] bg-white p-5 text-2xl font-semibold shadow-sm focus:border-emerald-500 focus:outline-none"
        />

        {search.trim() !== "" && (
          <div className="mt-4 max-h-96 overflow-y-auto rounded-3xl border bg-white shadow-lg">
            {filteredMembers.slice(0, 10).map((member) => {
              const checked = alreadyCheckedIn(member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b p-4 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-4">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl">
                        🙏
                      </div>
                    )}

                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {member.full_name}
                      </p>
                      <p className="text-gray-500">
                        {member.nickname || member.phone || "-"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckin(member)}
                    disabled={checked || !selectedSessionId}
                    className={
                      checked || !selectedSessionId
                        ? "rounded-xl bg-gray-300 px-5 py-3 font-semibold text-gray-600"
                        : "rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow hover:bg-green-800"
                    }
                  >
                    {checked ? "เช็คอินแล้ว" : "Check-in"}
                  </button>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                ไม่พบสมาชิกที่ค้นหา
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-[#4b5f4a]">
          🎉 เช็คอินล่าสุด / Latest Check-in
        </h2>

        {latestCheckin ? (
          <div className="mt-5 flex flex-col items-center rounded-[2rem] border border-green-200 bg-green-50 p-8 text-center shadow-lg">
            <div className="mb-4 h-40 w-40 overflow-hidden rounded-full border-4 border-green-300 bg-white">
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

            <h3 className="text-4xl font-black text-slate-900">
              {latestCheckin.members?.full_name || "-"}
            </h3>

            <p className="mt-1 text-2xl text-gray-600">
              {latestCheckin.members?.nickname || ""}
            </p>

            <p className="mt-5 text-3xl font-black text-green-700">
              เช็คอินสำเร็จ ✅
            </p>

            <p className="mt-3 text-gray-600">
              {latestCheckin.checkin_time
                ? new Date(latestCheckin.checkin_time).toLocaleTimeString()
                : ""}
            </p>

            <p className="mt-4 rounded-2xl bg-white px-5 py-3 text-lg font-bold text-green-700">
              มาทั้งหมด {latestCheckin.totalVisits || 0} ครั้ง
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-[2rem] border bg-white p-8 text-center shadow-sm">
            <div className="text-7xl animate-pulse">🙏</div>
            <p className="mt-4 text-2xl font-black text-[#4b5f4a]">
              Waiting for Check-in
            </p>
            <p className="mt-2 text-gray-500">
              เมื่อเช็คอินสำเร็จ สมาชิกคนล่าสุดจะแสดงตรงนี้
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-[#4b5f4a]">
          เช็คอินล่าสุด 5 คน
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {latestFiveCheckins.length > 0 ? (
            latestFiveCheckins.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl bg-[#fffdf8] p-4 shadow-sm"
              >
                {item.members?.profile_photo_url ? (
                  <img
                    src={item.members.profile_photo_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                    🙏
                  </div>
                )}

                <div>
                  <p className="font-bold">{item.members?.full_name || "-"}</p>
                  <p className="text-sm text-gray-500">
                    {item.members?.nickname || "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">ยังไม่มีเช็คอินใน Session นี้</p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
        <h2 className="text-2xl font-black text-[#4b5f4a]">
          รายการเช็คอินวันนี้ / Today&apos;s Check-ins
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-left">สมาชิก</th>
                <th className="p-3 text-left">เวลา</th>
                <th className="p-3 text-left">Session</th>
                <th className="p-3 text-center">จัดการ</th>
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
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    ยังไม่มี Check-in วันนี้ / No check-ins today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
);
}