"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TrashPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingMemberId, setWorkingMemberId] = useState("");

  useEffect(() => {
    loadDeletedMembers();
  }, []);

  async function loadDeletedMembers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_deleted", true)
      .order("full_name");

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMembers(data || []);
  }

  async function restoreMember(id: string) {
    if (workingMemberId) return;

    setWorkingMemberId(id);

    const { error } = await supabase
      .from("members")
      .update({
        is_deleted: false,
      })
      .eq("id", id);

    setWorkingMemberId("");

    if (error) {
      alert(error.message);
      return;
    }

    alert("กู้คืนสมาชิกเรียบร้อย / Member restored");
    await loadDeletedMembers();
  }

  async function permanentlyDeleteMember(member: any) {
    if (workingMemberId) return;

    const memberName = member.full_name || "สมาชิกคนนี้";

    const confirmed = window.confirm(
      `ต้องการลบ "${memberName}" แบบถาวรหรือไม่?\n\n` +
        "ข้อมูลนี้จะไม่สามารถกู้คืนได้\n" +
        "Permanently delete this member?"
    );

    if (!confirmed) return;

    const confirmedAgain = window.confirm(
      `ยืนยันอีกครั้ง: ลบ "${memberName}" ถาวรจริงหรือไม่?`
    );

    if (!confirmedAgain) return;

    setWorkingMemberId(member.id);

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", member.id)
      .eq("is_deleted", true);

    setWorkingMemberId("");

    if (error) {
      alert(
        `${error.message}\n\n` +
          "หากสมาชิกมีประวัติ Check-in ระบบฐานข้อมูลอาจไม่อนุญาตให้ลบ " +
          "เพื่อป้องกันข้อมูลรายงานเสียหาย"
      );
      return;
    }

    alert("ลบสมาชิกถาวรเรียบร้อย / Member permanently deleted");
    await loadDeletedMembers();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#4b5f4a]">
              🗑️ Recycle Bin
            </h1>

            <p className="mt-2 text-gray-600">
              สมาชิกที่ถูกลบสามารถกู้คืน หรือลบออกจากระบบแบบถาวรได้
            </p>
          </div>

          <Link
            href="/members"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← กลับรายชื่อสมาชิก
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="rounded-xl border p-6 text-center text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          )}

          {!loading &&
            members.map((member) => {
              const isWorking = workingMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {member.full_name || "-"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {member.code_number || "-"} ·{" "}
                      {member.phone || member.email || "-"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => restoreMember(member.id)}
                      disabled={Boolean(workingMemberId)}
                      className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isWorking ? "กำลังดำเนินการ..." : "Restore"}
                    </button>

                    <button
                      type="button"
                      onClick={() => permanentlyDeleteMember(member)}
                      disabled={Boolean(workingMemberId)}
                      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isWorking
                        ? "กำลังดำเนินการ..."
                        : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              );
            })}

          {!loading && members.length === 0 && (
            <div className="rounded-xl border p-6 text-center text-gray-500">
              ไม่มีสมาชิกในถังขยะ
            </div>
          )}
        </div>
      </div>
    </main>
  );
}