"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  full_name: string;
  nickname: string | null;
  role: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  profile_photo_url: string | null;
  status: string | null;
  notes: string | null;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    async function loadStaff() {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        return;
      }

      setStaff(data || []);
    }

    loadStaff();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl">
        <a
          href="/"
          className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
        >
          🏠 กลับหน้าหลัก
        </a>

        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Staff Directory
        </h1>

        <p className="mt-1 text-gray-600">
          รายชื่อเจ้าหน้าที่และหน้าที่รับผิดชอบ
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {staff.map((person) => (
            <div
              key={person.id}
              className="rounded-3xl bg-white p-5 shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                  {person.profile_photo_url ? (
                    <img
                      src={person.profile_photo_url}
                      alt={person.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#4b5f4a]">
                    {person.full_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {person.nickname}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p><b>Role:</b> {person.role}</p>
                <p><b>Department:</b> {person.department || "-"}</p>
                <p><b>Phone:</b> {person.phone || "-"}</p>
                <p><b>Email:</b> {person.email || "-"}</p>
                <p><b>Status:</b> {person.status || "active"}</p>
                <p><b>Notes:</b> {person.notes || "-"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}