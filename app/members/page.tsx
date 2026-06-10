"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("admin");

    if (!admin) {
      router.push("/login");
      return;
    }

    loadMembers();
  }, [router]);

  async function loadMembers() {
    const { data, error } = await supabase.from("members").select("*");

    if (error) {
      alert(error.message);
      return;
    }

    const sortedMembers = (data || []).sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || "", ["en", "th"], {
        sensitivity: "base",
      })
    );

    setMembers(sortedMembers);
  }

  const filteredMembers = members.filter((member) => {
    const keyword = search.toLowerCase();

    return (
      member.full_name?.toLowerCase().includes(keyword) ||
      member.nickname?.toLowerCase().includes(keyword) ||
      member.phone?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          รายชื่อสมาชิก / Members List
        </h1>

        <p className="mt-2 text-gray-600">
          สมาชิกทั้งหมด / Total Members: {filteredMembers.length}
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล / Search name, nickname, phone or email"
          className="mt-6 w-full rounded-xl border p-3"
        />

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-[#f7f3ea]">
                <th className="p-3">รูป / Photo</th>
                <th className="p-3">ชื่อ / Name</th>
                <th className="p-3">ชื่อเล่น / Nickname</th>
                <th className="p-3">โทร / Phone</th>
                <th className="p-3">อีเมล / Email</th>
                <th className="p-3">จัดการ / Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="p-3">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt={member.full_name || ""}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-3">{member.full_name || "-"}</td>
                  <td className="p-3">{member.nickname || "-"}</td>
                  <td className="p-3">{member.phone || "-"}</td>
                  <td className="p-3">{member.email || "-"}</td>

                  <td className="p-3">
                    <a
                      href={`/members/${member.id}`}
                      className="rounded-lg bg-green-700 px-3 py-2 text-white"
                    >
                      ดูข้อมูล
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}