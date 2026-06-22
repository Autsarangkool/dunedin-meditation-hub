"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
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

  async function handleDelete(id: string) {
    const confirmed = confirm("ต้องการลบ Staff คนนี้ใช่ไหม?");

    if (!confirmed) return;

    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setStaff((prev) => prev.filter((person) => person.id !== id));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <StaffBackground />

      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.65),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(186,230,253,0.45),transparent_34%)]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-6xl opacity-25">
            🕊️
          </div>
          <div className="pointer-events-none absolute bottom-8 right-24 text-5xl opacity-25">
            🌸
          </div>
          <div className="pointer-events-none absolute bottom-8 left-8 text-5xl opacity-20">
            🌿
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-3">
              <TopButton href="/" tone="teal">
                🏠 กลับหน้าหลัก
              </TopButton>

              <TopButton href="/staff/new" tone="emerald">
                ➕ เพิ่มเจ้าหน้าที่
              </TopButton>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Staff Directory
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  รายชื่อเจ้าหน้าที่ / Staff Directory
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  รายชื่อเจ้าหน้าที่ ผู้นำสมาธิ และหน้าที่รับผิดชอบของแต่ละคน
                  ในรูปแบบที่ดูสบายตาและเป็นระเบียบ
                </p>
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <MiniStat label="เจ้าหน้าที่ทั้งหมด" value={staff.length} />
                <MiniStat
                  label="Active"
                  value={
                    staff.filter((person) => (person.status || "active") === "active")
                      .length
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((person) => (
            <StaffCard
              key={person.id}
              person={person}
              onDelete={() => handleDelete(person.id)}
            />
          ))}
        </section>

        {staff.length === 0 && (
          <div className="mt-8 rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
            <div className="text-5xl">🌿</div>

            <h2 className="mt-4 text-2xl font-black text-emerald-900">
              ยังไม่มีเจ้าหน้าที่
            </h2>

            <p className="mt-2 text-slate-500">
              กด “เพิ่มเจ้าหน้าที่” เพื่อเริ่มเพิ่มรายชื่อทีมงาน
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function StaffBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(135deg,#f8fbf6_0%,#fff8ec_48%,#eef9f4_100%)]"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute left-[18%] top-[-120px] h-[460px] w-[560px] rounded-full bg-sky-200/28 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-amber-200/28 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[22%] h-[520px] w-[520px] rounded-full bg-lime-200/25 blur-3xl" />

        <div className="absolute right-12 top-28 text-6xl opacity-25">🕊️</div>
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-20">
          🌿
        </div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-20">
          🌸
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 w-full opacity-30"
      >
        <svg
          viewBox="0 0 1440 240"
          className="h-auto w-full fill-sky-200"
          preserveAspectRatio="none"
        >
          <path d="M0,144L60,133.3C120,123,240,101,360,112C480,123,600,165,720,165.3C840,165,960,123,1080,122.7C1200,123,1320,165,1380,186.7L1440,208L1440,320L0,320Z" />
        </svg>
      </div>
    </>
  );
}

function StaffCard({
  person,
  onDelete,
}: {
  person: Staff;
  onDelete: () => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/92 hover:shadow-[0_28px_85px_rgba(15,23,42,0.16)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-sky-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-10 transition group-hover:opacity-20">
        🌿
      </div>

      <div className="relative">
        <div className="flex items-center gap-4">
          <StaffAvatar person={person} />

          <div className="min-w-0">
            <h2 className="truncate text-xl font-black tracking-tight text-emerald-950">
              {person.full_name || "-"}
            </h2>

            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {person.nickname || "-"}
            </p>

            <div className="mt-2">
              <StatusPill status={person.status || "active"} />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl border border-emerald-50 bg-white/60 p-4 text-sm shadow-inner">
          <InfoRow label="Role" value={person.role || "-"} />
          <InfoRow label="Department" value={person.department || "-"} />
          <InfoRow label="Phone" value={person.phone || "-"} />
          <InfoRow label="Email" value={person.email || "-"} />
          <InfoRow label="Notes" value={person.notes || "-"} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/staff/${person.id}`}
            className="rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg"
          >
            ดูข้อมูล
          </Link>

          <Link
            href={`/staff/${person.id}/edit`}
            className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
          >
            ✏️ Edit
          </Link>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function StaffAvatar({ person }: { person: Staff }) {
  if (person.profile_photo_url) {
    return (
      <img
        src={person.profile_photo_url}
        alt={person.full_name || ""}
        className="h-20 w-20 shrink-0 rounded-full object-cover shadow-md ring-4 ring-white"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-4xl shadow-inner ring-4 ring-white">
      👤
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2">
      <strong className="shrink-0 text-slate-900">{label}:</strong>
      <span className="min-w-0 truncate text-slate-600">{value}</span>
    </p>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-emerald-700">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status.toLowerCase() === "active";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${
        isActive
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-amber-100 bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function TopButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "teal" | "emerald";
  children: ReactNode;
}) {
  const tones = {
    teal: "from-teal-500 to-emerald-500 shadow-emerald-100 hover:shadow-emerald-200",
    emerald:
      "from-emerald-600 to-teal-600 shadow-emerald-100 hover:shadow-emerald-200",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${tones[tone]}`}
    >
      {children}
    </Link>
  );
}