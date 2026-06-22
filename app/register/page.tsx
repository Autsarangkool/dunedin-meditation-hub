"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  function convertDateToISO(dateText: string) {
    if (!dateText) return null;

    const [day, month, year] = dateText.split("/").map((item) => item.trim());

    if (!day || !month || !year) return null;

    return `${year}-${month}-${day}`;
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadProfilePhoto() {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `member-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    setSaving(true);

    try {
      const profilePhotoUrl = await uploadProfilePhoto();

      const payload = {
        code_number: formData.get("code_number"),
        full_name: formData.get("full_name"),
        nickname: formData.get("nickname"),
        gender: formData.get("gender"),
        birth_date: convertDateToISO(formData.get("birth_date") as string),
        nationality: formData.get("nationality"),

        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),

        meditated_before: formData.get("meditated_before"),
        meditation_duration: formData.get("meditation_duration"),
        meditation_preferences: formData.getAll("meditation_preferences"),
        joining_goals: formData.getAll("joining_goals"),
        joining_goal_other: formData.get("joining_goal_other"),

        preferred_days: formData.get("preferred_days"),
        referral_source: formData.get("referral_source"),
        referral_other: formData.get("referral_other"),

        consent_agreed: formData.get("consent_agreed") === "on",
        signature_name: formData.get("signature_name"),
        start_date: convertDateToISO(formData.get("start_date") as string),

        profile_photo_url: profilePhotoUrl,
      };

      const { error } = await supabase.from("members").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      alert("ลงทะเบียนสำเร็จ / Registration successful");
      form.reset();
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (error: any) {
      alert(error.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <RegisterBackground />

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

            <div className="mt-8">
              <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                Membership Registration
              </p>

              <p className="mt-5 text-sm font-semibold text-amber-700">
                Take an hour to unwind, refocus, and reset.
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                Mindfulness Meditation Membership Form
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                DIRI – Dunedin Meditation Hub
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <FormSection
            title="รูปโปรไฟล์ / Profile Photo"
            subtitle="อัปโหลดรูปสมาชิก เพื่อให้ระบบจำแนกและจัดการข้อมูลได้ง่ายขึ้น"
            icon="🙏"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-5xl shadow-inner ring-4 ring-white">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>🙏</span>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/85 p-3 text-sm font-medium text-slate-600 shadow-sm file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-emerald-700"
                />

                <p className="mt-3 text-sm text-slate-500">
                  แนะนำรูปหน้าชัด ๆ ไฟล์ JPG หรือ PNG
                </p>
              </div>
            </div>
          </FormSection>

          <TextInput name="code_number" placeholder="Code Number" />
          <TextInput name="full_name" placeholder="Full Name" required />
          <TextInput name="nickname" placeholder="Preferred Name / Nickname" />

          <SelectInput name="gender">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </SelectInput>

          <TextInput
            name="birth_date"
            type="text"
            inputMode="numeric"
            placeholder="Date of Birth DD/MM/YYYY"
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
          />

          <TextInput name="nationality" placeholder="Nationality" />
          <TextInput name="phone" type="tel" placeholder="Phone Number" />
          <TextInput name="email" type="email" placeholder="Email" />

          <textarea
            name="address"
            className="min-h-28 rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
            placeholder="Address"
            rows={3}
          />

          <FormSection
            title="Meditation Experience"
            subtitle="ประสบการณ์การนั่งสมาธิของสมาชิก"
            icon="🌿"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectInput name="meditated_before">
                <option value="">Have you meditated before?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </SelectInput>

              <SelectInput name="meditation_duration">
                <option value="">If yes, how long?</option>
                <option value="less_than_3_months">Less than 3 months</option>
                <option value="3_to_12_months">3–12 months</option>
                <option value="more_than_1_year">More than 1 year</option>
              </SelectInput>
            </div>
          </FormSection>

          <FormSection
            title="Preferred Meditation Style"
            subtitle="Select all that apply"
            icon="🕊️"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["mindfulness_meditation", "Mindfulness Meditation"],
                ["breathing_awareness", "Breathing Awareness"],
                ["loving_kindness_metta", "Loving-Kindness (Metta)"],
                ["walking_meditation", "Walking Meditation"],
                ["reduce_stress", "Reduce Stress"],
                ["relaxation", "Relaxation"],
                ["mental_clarity", "Mental Clarity"],
                ["spiritual_growth", "Spiritual Growth"],
                ["improve_focus", "Improve Focus"],
                ["happiness", "Happiness"],
              ].map(([value, label]) => (
                <CheckboxCard
                  key={value}
                  name="meditation_preferences"
                  value={value}
                >
                  {label}
                </CheckboxCard>
              ))}
            </div>
          </FormSection>

          <FormSection title="Goals for Joining" icon="🌸">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["relaxation", "Relaxation"],
                ["mental_clarity", "Mental clarity"],
                ["spiritual_growth", "Spiritual growth"],
                ["improve_focus", "Improve focus"],
              ].map(([value, label]) => (
                <CheckboxCard key={value} name="joining_goals" value={value}>
                  {label}
                </CheckboxCard>
              ))}

              <input
                name="joining_goal_other"
                className="rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
                placeholder="Other goal"
              />
            </div>
          </FormSection>

          <SelectInput name="preferred_days">
            <option value="">Preferred Days</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="both">Both days</option>
          </SelectInput>

          <SelectInput name="referral_source">
            <option value="">How did you hear about us?</option>
            <option value="social_media">Social Media</option>
            <option value="friends_family">Friends / Family</option>
            <option value="poster">Poster</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </SelectInput>

          <TextInput
            name="referral_other"
            placeholder="Referral other"
            className="md:col-span-2"
          />

          <FormSection title="Consent" icon="🍃">
            <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm backdrop-blur">
              <input
                name="consent_agreed"
                type="checkbox"
                required
                className="mt-1 h-5 w-5 accent-emerald-600"
              />

              <span className="font-medium leading-6 text-slate-700">
                I agree to participate in the meditation sessions organised by
                DIRI.
              </span>
            </label>
          </FormSection>

          <TextInput name="signature_name" placeholder="Signature / Full Name" />

          <TextInput
            name="start_date"
            type="text"
            inputMode="numeric"
            placeholder="Start Date DD/MM/YYYY"
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-lg font-black text-white shadow-xl shadow-emerald-100 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 md:col-span-2"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล / Register"}
          </button>
        </form>
      </div>
    </main>
  );
}

function RegisterBackground() {
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

function FormSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.09)] backdrop-blur-2xl md:col-span-2">
      <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-10">
        {icon}
      </div>

      <div className="relative">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-2xl shadow-inner ring-1 ring-emerald-100">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-black text-emerald-950">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}

function TextInput({
  name,
  placeholder,
  type = "text",
  required,
  inputMode,
  pattern,
  className = "",
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "search" | "email" | "url";
  pattern?: string;
  className?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      inputMode={inputMode}
      pattern={pattern}
      className={`rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 ${className}`}
      placeholder={placeholder}
    />
  );
}

function SelectInput({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <select
      name={name}
      className="rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
    >
      {children}
    </select>
  );
}

function CheckboxCard({
  name,
  value,
  children,
}: {
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 font-medium text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <input
        type="checkbox"
        name={name}
        value={value}
        className="h-5 w-5 accent-emerald-600"
      />
      <span>{children}</span>
    </label>
  );
}