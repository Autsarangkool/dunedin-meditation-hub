"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) loadData();
  }, [sessionId]);

  async function loadData() {
    setLoading(true);

    const { data: sessionData } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    const { data: checkinData } = await supabase
      .from("checkins")
      .select("*, members(*)")
      .eq("session_id", sessionId)
      .order("checkin_time", { ascending: true });

    setSession(sessionData);
    setCheckins(checkinData || []);
    setLoading(false);
  }

  function escapeCSV(value: any) {
    if (value === null || value === undefined) return "";

    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  }

  function exportCSV() {
    if (!session) {
      alert("ยังไม่พบข้อมูล Session");
      return;
    }

    if (checkins.length === 0) {
      alert("ยังไม่มีรายชื่อผู้เข้าร่วมให้ Export");
      return;
    }

    const headers = [
      "No",
      "Full Name",
      "Nickname",
      "Phone",
      "Email",
      "Session Name",
      "Session Number",
      "Session Date",
      "Check-in Date",
      "Check-in Time",
    ];

    const rows = checkins.map((item, index) => [
      index + 1,
      item.members?.full_name || "",
      item.members?.nickname || "",
      item.members?.phone || "",
      item.members?.email || "",
      session.session_name || item.session_name || "",
      session.session_number || "",
      session.event_date || "",
      item.checkin_date || "",
      item.checkin_time
        ? new Date(item.checkin_time).toLocaleTimeString()
        : "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const fileName = `session-${session.session_number || session.id}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function deleteCheckin(id: string) {
  if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

  const { error } = await supabase
    .from("checkins")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  setCheckins((prev) =>
    prev.filter((item) => String(item.id) !== String(id))
  );

  await loadData();
}

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#4b5f4a]">
              รายชื่อผู้เข้าร่วม Session
            </h1>

            {session && (
              <p className="mt-2 text-gray-600">
                {session.session_name}{" "}
                {session.session_number ? `(${session.session_number})` : ""} ·{" "}
                {session.event_date || "-"}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Export CSV
            </button>

            <Link
              href="/sessions"
              className="rounded-xl border px-5 py-3 font-semibold"
            >
              ← กลับ
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-8">กำลังโหลด...</p>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border bg-[#fffdf8] p-5">
              <p className="text-xl font-semibold">
                ผู้เข้าร่วมทั้งหมด {checkins.length} คน
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {checkins.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border bg-[#fffdf8] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                      {index + 1}
                    </div>

                    {item.members?.profile_photo_url ? (
                      <img
                        src={item.members.profile_photo_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
                        🙏
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">
                        {item.members?.full_name || "-"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.members?.nickname || item.members?.phone || ""}
                      </p>

                      <p className="text-sm text-gray-500">
                        เวลา{" "}
                        {item.checkin_time
                          ? new Date(item.checkin_time).toLocaleTimeString()
                          : "-"}
                      </p>
                    </div>
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
                <div className="rounded-xl border bg-[#fffdf8] p-8 text-center text-gray-500">
                  ยังไม่มีผู้เช็คอินใน Session นี้
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}