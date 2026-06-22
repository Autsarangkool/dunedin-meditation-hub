"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoggingIn(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoggingIn(false);

    if (error) {
      alert("Email หรือ Password ไม่ถูกต้อง");
      return;
    }

    if (data.session) {
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800`;
    }

    window.location.href = "/";
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f5ec] px-4 py-8 sm:px-6">
      <LoginBackground />

      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏠 กลับหน้าหลัก
            </Link>

            <div className="mt-10">
              <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                Admin Access
              </p>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-emerald-900 sm:text-6xl">
                Welcome Back
              </h1>

              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600">
                Dunedin Meditation Hub staff portal สำหรับจัดการสมาชิก
                เช็คอิน session report และข้อมูลภายในระบบ
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <TrustCard icon="🌿" title="Calm">
                Clean admin workspace
              </TrustCard>

              <TrustCard icon="🕊️" title="Secure">
                Staff login only
              </TrustCard>

              <TrustCard icon="🌸" title="Simple">
                Easy daily operation
              </TrustCard>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleLogin}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/80 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-80px] h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 text-5xl opacity-15">
            🙏
          </div>

          <div className="relative">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-5xl shadow-inner ring-8 ring-white/70">
              🙏
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-3xl font-black text-emerald-950">
                Admin Login
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Sign in to manage Dunedin Meditation Hub
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Email"
                  className="h-14 w-full rounded-2xl border border-emerald-100 bg-white/85 px-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Password"
                  className="h-14 w-full rounded-2xl border border-emerald-100 bg-white/85 px-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-black text-white shadow-xl shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
            >
              {loggingIn ? "กำลังเข้าสู่ระบบ..." : "Login"}
            </button>

            <p className="mt-5 text-center text-xs font-medium text-slate-400">
              For authorised staff only
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

function LoginBackground() {
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

function TrustCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="text-3xl">{icon}</div>
      <p className="mt-2 font-black text-emerald-950">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{children}</p>
    </div>
  );
}