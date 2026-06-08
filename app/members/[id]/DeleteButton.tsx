"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DeleteButton({
  memberId,
}: {
  memberId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "คุณต้องการลบสมาชิกคนนี้ใช่หรือไม่?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("ลบสมาชิกเรียบร้อย");
    router.push("/members");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600 px-4 py-2 text-white"
    >
      ลบสมาชิก
    </button>
  );
}