"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

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
  }

  function resetForm() {
    setSessionName("");
    setSessionNumber("");
    setEventDate("");
    setEditingId(null);
  }

  function generateNextSessionNumber() {
    const numbers = sessions
      .map((s) => s.session_number)
      .filter(Boolean)
      .map((num) => Number(String(num).replace("R", "")))
      .filter((num) => !isNaN(num));

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `R${String(next).padStart(3, "0")}`;
  }

  async function saveSession() {
    if (!sessionName || !eventDate) {
      alert("กรุณากรอกชื่อรุ่นและวันที่");
      return;
    }

    const finalSessionNumber =
      sessionNumber.trim() || generateNextSessionNumber();

    if (editingId) {
      const { error } = await supabase
        .from("sessions")
        .update({
          session_name: sessionName,
          session_number: finalSessionNumber,
          event_date: eventDate,
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("sessions").insert({
        session_name: sessionName,
        session_number: finalSessionNumber,
        event_date: eventDate,
      });

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm();
    loadSessions();
  }

  function editSession(session: any) {
    setEditingId(session.id);
    setSessionName(session.session_name || "");
    setSessionNumber(session.session_number || "");
    setEventDate(session.event_date || "");
  }

  async function deleteSession(id: string) {
    if (!confirm("ต้องการลบรุ่นนี้ใช่ไหม?")) return;

    const { error } = await supabase.from("sessions").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSessions();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          จัดการรุ่น / Session Management
        </h1>

        <section className="mt-6 rounded-2xl border bg-[#fffdf8] p-6">
          <h2 className="text-xl font-semibold text-[#4b5f4a]">
            {editingId ? "แก้ไขรุ่น" : "สร้างรุ่นใหม่"}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="ชื่อรุ่น เช่น ครั้งที่ 2"
              className="rounded-xl border p-3"
            />

            <input
              value={sessionNumber}
              onChange={(e) => setSessionNumber(e.target.value)}
              placeholder={`รหัส เช่น ${generateNextSessionNumber()}`}
              className="rounded-xl border p-3"
            />

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="rounded-xl border p-3"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveSession}
              className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              {editingId ? "บันทึกการแก้ไข" : "+ สร้างรุ่นใหม่"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border px-6 py-3 font-semibold"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[#4b5f4a]">
            รายการรุ่นทั้งหมด
          </h2>

          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border bg-[#fffdf8] p-4"
              >
                <div>
                  <p className="text-lg font-semibold">
                    {session.session_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {session.session_number || "-"} · {session.event_date || "-"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                  >
                    View
                  </Link>

                  <button
                    onClick={() => editSession(session)}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSession(session.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <p className="text-gray-500">ยังไม่มีรุ่น / No sessions yet</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}