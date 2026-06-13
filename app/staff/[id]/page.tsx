"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", staffId)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setStaff(data);
      setLoading(false);
    }

    if (staffId) loadStaff();
  }, [staffId]);

  if (loading) return <main className="p-8">กำลังโหลด...</main>;

  if (!staff) return <main className="p-8">ไม่พบข้อมูลเจ้าหน้าที่</main>;

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-md">
        <Link
          href="/staff"
          className="mb-6 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white"
        >
          ← กลับรายชื่อเจ้าหน้าที่
        </Link>

        <div className="flex items-center gap-6">
          {staff.profile_photo_url ? (
            <img
              src={staff.profile_photo_url}
              alt=""
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-5xl">
              🙏
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold text-[#4b5f4a]">
              {staff.full_name}
            </h1>
            <p className="mt-1 text-xl text-gray-600">{staff.nickname}</p>
            <p className="mt-2 text-emerald-700">{staff.role || "-"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border bg-[#fffdf8] p-6">
          <p><b>แผนก:</b> {staff.department || "-"}</p>
          <p><b>โทรศัพท์:</b> {staff.phone || "-"}</p>
          <p><b>อีเมล:</b> {staff.email || "-"}</p>
          <p><b>สถานะ:</b> {staff.status || "-"}</p>
          <p><b>หมายเหตุ:</b> {staff.notes || "-"}</p>
        </div>
      </div>
    </main>
  );
}