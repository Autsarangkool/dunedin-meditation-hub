"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RealtimeDashboardStats({
  initialMembers,
  initialCheckins,
}: {
  initialMembers: number;
  initialCheckins: number;
}) {
  const [totalMembers, setTotalMembers] = useState(initialMembers);
  const [totalCheckins, setTotalCheckins] = useState(initialCheckins);

  async function refreshCounts() {
    const { count: membersCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true });

    const { count: checkinsCount } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true });

    setTotalMembers(membersCount || 0);
    setTotalCheckins(checkinsCount || 0);
  }

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        refreshCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        refreshCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <p className="text-lg font-bold text-slate-600">
          สมาชิกทั้งหมด / Total Members
        </p>
        <p className="mt-2 text-7xl font-black text-blue-600">
          {totalMembers}
        </p>
        <p className="mt-2 text-xl font-bold text-slate-600">คน</p>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <p className="text-lg font-bold text-slate-600">
          เช็คอินสะสมทั้งหมด / All-Time Check-ins
        </p>
        <p className="mt-2 text-7xl font-black text-emerald-600">
          {totalCheckins}
        </p>
        <p className="mt-2 text-xl font-bold text-slate-600">ครั้ง</p>
      </div>
    </div>
  );
}