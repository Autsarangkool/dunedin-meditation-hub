"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  function convertDateToISO(dateText: string) {
    if (!dateText) return null;
    const [day, month, year] = dateText.split("/");
    if (!day || !month || !year) return null;
    return `${year}-${month}-${day}`;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      .from("member-photos")
      .upload(filePath, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("member-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

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
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <a
          href="/"
          className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
        >
          🏠 กลับหน้าหลัก
        </a>

        <p className="text-sm font-medium text-[#7a6a43]">
          Take an hour to unwind, refocus, and reset.
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#4b5f4a]">
          Mindfulness Meditation Membership Form
        </h1>

        <p className="mt-1 text-gray-600">
          DIRI – Dunedin Meditation Hub
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <label className="font-semibold text-[#4b5f4a]">
              รูปโปรไฟล์ / Profile Photo
            </label>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🙏</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="rounded-lg border p-3"
              />
            </div>
          </section>

          <input
            name="code_number"
            className="rounded-lg border p-3"
            placeholder="Code Number"
          />

          <input
            name="full_name"
            className="rounded-lg border p-3"
            placeholder="Full Name"
            required
          />

          <input
            name="nickname"
            className="rounded-lg border p-3"
            placeholder="Preferred Name / Nickname"
          />

          <select name="gender" className="rounded-lg border p-3">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <input
            name="birth_date"
            type="text"
            inputMode="numeric"
            placeholder="Date of Birth DD/MM/YYYY"
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
            className="rounded-lg border p-3"
          />

          <input
            name="nationality"
            className="rounded-lg border p-3"
            placeholder="Nationality"
          />

          <input
            name="phone"
            className="rounded-lg border p-3"
            type="tel"
            placeholder="Phone Number"
          />

          <input
            name="email"
            className="rounded-lg border p-3"
            type="email"
            placeholder="Email"
          />

          <textarea
            name="address"
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="Address"
            rows={3}
          />

          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <h2 className="font-semibold text-[#4b5f4a]">
              Meditation Experience
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select name="meditated_before" className="rounded-lg border p-3">
                <option value="">Have you meditated before?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>

              <select name="meditation_duration" className="rounded-lg border p-3">
                <option value="">If yes, how long?</option>
                <option value="less_than_3_months">Less than 3 months</option>
                <option value="3_to_12_months">3–12 months</option>
                <option value="more_than_1_year">More than 1 year</option>
              </select>
            </div>
          </div>
<div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
  <h2 className="font-semibold text-[#4b5f4a]">
    Preferred Meditation Style
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Select all that apply
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
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
      <label key={value} className="flex items-center gap-2">
        <input
          type="checkbox"
          name="meditation_preferences"
          value={value}
        />
        {label}
      </label>
    ))}
  </div>
</div>
          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <h2 className="font-semibold text-[#4b5f4a]">
              Goals for Joining
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["relaxation", "Relaxation"],
                ["mental_clarity", "Mental clarity"],
                ["spiritual_growth", "Spiritual growth"],
                ["improve_focus", "Improve focus"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="checkbox" name="joining_goals" value={value} />
                  {label}
                </label>
              ))}

              <input
                name="joining_goal_other"
                className="rounded-lg border p-3 md:col-span-2"
                placeholder="Other goal"
              />
            </div>
          </div>

          <select name="preferred_days" className="rounded-lg border p-3">
            <option value="">Preferred Days</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="both">Both days</option>
          </select>

          <select name="referral_source" className="rounded-lg border p-3">
            <option value="">How did you hear about us?</option>
            <option value="social_media">Social Media</option>
            <option value="friends_family">Friends / Family</option>
            <option value="poster">Poster</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>

          <input
            name="referral_other"
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="Referral other"
          />

          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <h2 className="font-semibold text-[#4b5f4a]">Consent</h2>

            <label className="mt-4 flex items-start gap-3">
              <input
                name="consent_agreed"
                type="checkbox"
                required
                className="mt-1"
              />
              <span>
                I agree to participate in the meditation sessions organised by DIRI.
              </span>
            </label>
          </div>

          <input
            name="signature_name"
            className="rounded-lg border p-3"
            placeholder="Signature / Full Name"
          />

          <input
            name="start_date"
            type="text"
            inputMode="numeric"
            placeholder="Start Date DD/MM/YYYY"
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
            className="rounded-lg border p-3"
          />

          <button
            type="submit"
            className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 md:col-span-2"
          >
            บันทึกข้อมูล / Register
          </button>
        </form>
      </div>
    </main>
  );
}