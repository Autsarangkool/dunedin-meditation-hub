"use client";

import { type ChangeEvent, type ReactNode, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [importCount, setImportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportCount(null);
    setLoading(true);
    setMessage("กำลังอ่านไฟล์... / Reading file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        setMessage("ไม่พบข้อมูลในไฟล์ / No records found in this file");
        setLoading(false);
        return;
      }

      setMessage("กำลังนำเข้าข้อมูล... / Importing records...");

      const { error } = await supabase.from("members").insert(rows);

      if (error) {
        setMessage("นำเข้าไม่สำเร็จ / Import failed: " + error.message);
        setLoading(false);
        return;
      }

      setImportCount(rows.length);
      setMessage(`นำเข้าสำเร็จ / Imported successfully: ${rows.length} records`);
    } catch (error: any) {
      setMessage(error?.message || "นำเข้าไม่สำเร็จ / Import failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <ImportBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/72 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
            <a
              href="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </a>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Import Members
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  นำเข้าข้อมูลจาก Excel
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  Upload old member Excel file / อัปโหลดไฟล์ Excel สมาชิกเก่า
                  เพื่อนำข้อมูลเข้าสู่ระบบสมาชิก
                </p>
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <MiniStat label="ไฟล์ล่าสุด" value={fileName ? "Ready" : "-"} text />
                <MiniStat
                  label="Imported"
                  value={importCount === null ? "-" : importCount}
                  text={importCount === null}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-20">
            📥
          </div>

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-3xl shadow-inner ring-1 ring-emerald-100">
                📊
              </div>

              <div>
                <h2 className="text-2xl font-black text-emerald-950">
                  Upload Excel File
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  รองรับไฟล์ .xlsx, .xls และ .csv ระบบจะอ่าน sheet แรกแล้วนำเข้าไปยัง table members
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-dashed border-emerald-200 bg-white/65 p-6 text-center shadow-inner backdrop-blur">
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />

              <label
                htmlFor="excel-upload"
                className="mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-[1.75rem] border border-emerald-100 bg-white/80 px-6 py-10 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-4xl shadow-inner">
                  📁
                </div>

                <p className="mt-4 text-xl font-black text-emerald-950">
                  เลือกไฟล์ Excel
                </p>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  Click to choose .xlsx, .xls or .csv file
                </p>

                {fileName && (
                  <p className="mt-4 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                    {fileName}
                  </p>
                )}
              </label>
            </div>

            {message && (
              <div
                className={`mt-6 rounded-[1.5rem] border px-5 py-4 font-semibold shadow-sm backdrop-blur ${
                  message.includes("ไม่สำเร็จ") || message.includes("failed")
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{loading ? "⏳" : "🌿"}</span>
                  <p>{message}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <InfoCard title="หัวคอลัมน์ที่ควรมี" icon="🧾">
            Excel ควรมีหัวคอลัมน์ เช่น{" "}
            <strong>full_name, nickname, phone, email, age</strong>
          </InfoCard>

          <InfoCard title="คำแนะนำก่อนนำเข้า" icon="🍃">
            ตรวจสอบชื่อคอลัมน์ให้ตรงกับ field ใน table{" "}
            <strong>members</strong> ก่อน import เพื่อลด error
          </InfoCard>
        </section>
      </div>
    </main>
  );
}

function ImportBackground() {
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

function MiniStat({
  label,
  value,
  text,
}: {
  label: string;
  value: number | string;
  text?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p
        className={`mt-1 font-black text-emerald-700 ${
          text ? "text-2xl" : "text-3xl"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-2xl shadow-inner ring-1 ring-emerald-100">
          {icon}
        </div>

        <div>
          <h3 className="font-black text-emerald-950">{title}</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}