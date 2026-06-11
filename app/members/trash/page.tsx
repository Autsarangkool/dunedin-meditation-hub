"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TrashPage() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadDeletedMembers();
  }, []);

  async function loadDeletedMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_deleted", true)
      .order("full_name");

    if (error) {
      alert(error.message);
      return;
    }

    setMembers(data || []);
  }

  async function restoreMember(id: string) {
    const { error } = await supabase
      .from("members")
      .update({
        is_deleted: false,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadDeletedMembers();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#4b5f4a]">
            🗑️ Recycle Bin
          </h1>

          <Link
            href="/members"
            className="rounded-xl border px-4 py-2"
          >
            ← กลับรายชื่อสมาชิก
          </Link>
        </div>

        <p className="mt-2 text-gray-600">
          สมาชิกที่ถูกลบสามารถกู้คืนได้
        </p>

        <div className="mt-6 space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <div>
                <p className="font-semibold">
                  {member.full_name}
                </p>

                <p className="text-sm text-gray-500">
                  {member.phone || member.email || "-"}
                </p>
              </div>

              <button
                onClick={() => restoreMember(member.id)}
                className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
              >
                Restore
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <div className="rounded-xl border p-6 text-center text-gray-500">
              ไม่มีสมาชิกในถังขยะ
            </div>
          )}
        </div>
      </div>
    </main>
  );
}