"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSessions(data || []);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);

    const formData = new FormData(event.currentTarget);

    const { error } = await supabase
      .from("sessions")
      .insert({
        session_name: formData.get("session_name"),
        session_number: formData.get("session_number"),
        event_date: formData.get("event_date"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
        location: formData.get("location"),
        notes: formData.get("notes"),
      });

    setSaving(false);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    alert("สร้าง Session สำเร็จ");

    await loadSessions();
  }

  async function deleteSession(id: string) {
    if (!confirm("ลบ Session นี้?")) return;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSessions();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Session Management
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <input
            name="session_name"
            placeholder="Session Name"
            required
            className="rounded-xl border p-3"
          />

          <input
            name="session_number"
            placeholder="Session Number"
            className="rounded-xl border p-3"
          />

          <input
            type="date"
            name="event_date"
            required
            className="rounded-xl border p-3"
          />

          <input
            type="time"
            name="start_time"
            className="rounded-xl border p-3"
          />

          <input
            type="time"
            name="end_time"
            className="rounded-xl border p-3"
          />

          <input
            name="location"
            placeholder="Location"
            className="rounded-xl border p-3"
          />

          <textarea
            name="notes"
            placeholder="Notes"
            rows={3}
            className="rounded-xl border p-3 md:col-span-2"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-green-700 px-6 py-3 text-white"
          >
            {saving ? "Saving..." : "Create Session"}
          </button>
        </form>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-[#4b5f4a]">
            All Sessions
          </h2>

          <div className="mt-4 space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border bg-[#fffdf8] p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {session.session_name}
                    </h3>

                    <p>
                      รุ่น: {session.session_number || "-"}
                    </p>

                    <p>
                      วันที่: {session.event_date}
                    </p>

                    <p>
                      เวลา: {session.start_time} - {session.end_time}
                    </p>

                    <p>
                      สถานที่: {session.location}
                    </p>

                    <p className="mt-2 text-gray-600">
                      {session.notes}
                    </p>
                  </div>

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
              <p className="text-gray-500">
                ยังไม่มี Session
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}