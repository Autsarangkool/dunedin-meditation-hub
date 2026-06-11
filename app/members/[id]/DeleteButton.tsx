"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeleteButton({ memberId }: { memberId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "ยืนยันย้ายสมาชิกคนนี้เข้าถังขยะหรือไม่? / Move this member to Recycle Bin?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("members")
      .update({ is_deleted: true })
      .eq("id", memberId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("ย้ายสมาชิกเข้าถังขยะแล้ว / Member moved to Recycle Bin");
    router.push("/members");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      ย้ายเข้าถังขยะ / Delete
    </button>
  );
}