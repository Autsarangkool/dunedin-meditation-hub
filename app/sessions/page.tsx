"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    session_name: "",
    session_number: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    setSessions(data || []);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      session_name: "",
      session_number: "",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      notes: "",
    });
  }

  async function saveSession() {
    if (!form.session_name || !form.event_date) {
      alert("กรุณากรอกชื่อ Session และวันที่");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("sessions")
        .update(form)
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }

      alert("แก้ไข Session สำเร็จ");
    } else {
      const { error } = await supabase.from("sessions").insert(form);

      if (error) {
        alert(error.message);
        return;
      }

      alert("สร้าง Session สำเร็จ");
    }

    resetForm();
    loadSessions();
  }

  function editSession(session: any) {
    setEditingId(session.id);
    setForm({
      session_name: session.session_name || "",
      session_number: session.session_number || "",
      event_date: session.event_date || "",
      start_time: session.start_time || "",
      end_time: session.end_time || "",
      location: session.location || "",
      notes: session.notes || "",
    });
  }

  async function deleteSession(id: string) {
    const ok = confirm("ต้องการลบ Session นี้ใช่ไหม?");
    if (!ok) return;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("ลบ Session สำเร็จ");
    loadSessions();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Session Management
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            name="session_name"
            value={form.session_name}
            onChange={handleChange}
            placeholder="ชื่อ Session"
            className="rounded-xl border p-3"
          />

          <input
            name="session_number"
            value={form.session_number}
            onChange={handleChange}
            placeholder="เลข Session เช่น R001"
            className="rounded-xl border p-3"
          />

          <input
            type="date"
            name="event_date"
            value={form.event_date}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="สถานที่"
            className="rounded-xl border p-3"
          />
        </div>

        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Notes"
          className="mt-4 w-full rounded-xl border p-3"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveSession}
            className="rounded-lg bg-green-700 px-5 py-3 text-white"
          >
            {editingId ? "Save Changes" : "Create Session"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg bg-gray-500 px-5 py-3 text-white"
            >
              Cancel
            </button>
          )}
        </div>

        <h2 className="mt-10 text-2xl font-bold text-[#4b5f4a]">
          All Sessions
        </h2>

        <div className="mt-4 space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-[#e5dfcf] bg-[#fffdf8] p-4"
            >
              <p className="font-bold text-[#4b5f4a]">
                {session.session_name}
              </p>

              <p>เลข Session: {session.session_number || "-"}</p>
              <p>วันที่: {session.event_date || "-"}</p>
              <p>
                เวลา: {session.start_time || "-"} - {session.end_time || "-"}
              </p>
              <p>สถานที่: {session.location || "-"}</p>
              <p className="text-gray-600">{session.notes || ""}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => editSession(session)}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-white"
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
            <p className="text-gray-500">ยังไม่มี Session</p>
          )}
        </div>
      </div>
    </main>
  );
}