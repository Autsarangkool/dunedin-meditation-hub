"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);

    const photoFile = formData.get("profile_photo") as File;
    let profilePhotoUrl = "";

    if (photoFile && photoFile.size > 0) {
      const fileName = `${Date.now()}-${photoFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        setSaving(false);
        alert("อัปโหลดรูปไม่สำเร็จ / Photo upload failed: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      profilePhotoUrl = data.publicUrl;
    }

    const { error } = await supabase.from("members").insert({
      full_name: formData.get("full_name"),
      nickname: formData.get("nickname"),
      gender: formData.get("gender"),
      birth_date: formData.get("birth_date") || null,
      age: Number(formData.get("age")) || null,
      phone: formData.get("phone"),
      email: formData.get("email"),
      line_id: formData.get("line_id"),
      occupation: formData.get("occupation"),
      referral_source: formData.get("referral_source"),
      sitting_preference: formData.get("sitting_preference"),
      meditation_preference: formData.get("meditation_preference"),
      photo_consent: formData.get("photo_consent"),
      address: formData.get("address"),
      notes: formData.get("notes"),
      profile_photo_url: profilePhotoUrl,
    });

    setSaving(false);

    if (error) {
      alert("บันทึกไม่สำเร็จ / Save failed: " + error.message);
      return;
    }

    alert("บันทึกสำเร็จ / Saved successfully");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          ลงทะเบียนสมาชิกใหม่ / New Member Registration
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <input name="full_name" className="rounded-lg border p-3" placeholder="ชื่อ - นามสกุล / Full Name" required />
          <input name="nickname" className="rounded-lg border p-3" placeholder="ชื่อเล่น / Nickname" />

          <select name="gender" className="rounded-lg border p-3">
            <option value="">เพศ / Gender</option>
            <option value="male">ชาย / Male</option>
            <option value="female">หญิง / Female</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <input name="birth_date" className="rounded-lg border p-3" type="date" />
          <input name="age" className="rounded-lg border p-3" type="number" placeholder="อายุ / Age" />
          <input name="phone" className="rounded-lg border p-3" type="tel" placeholder="เบอร์โทร / Phone Number" />
          <input name="email" className="rounded-lg border p-3" type="email" placeholder="อีเมล / Email" />
          <input name="line_id" className="rounded-lg border p-3" placeholder="Line ID / Line ID" />
          <input name="occupation" className="rounded-lg border p-3" placeholder="อาชีพ / Occupation" />

          <select name="referral_source" className="rounded-lg border p-3">
            <option value="">รู้จักเราจากไหน / How did you hear about us?</option>
            <option value="friend">เพื่อน / Friend</option>
            <option value="poster">ป้ายโปรโมต / Poster or Sign</option>
            <option value="facebook">Facebook</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <select name="sitting_preference" className="rounded-lg border p-3">
            <option value="">รูปแบบการนั่ง / Sitting Preference</option>
            <option value="floor">นั่งพื้น / Floor Sitting</option>
            <option value="chair">นั่งเก้าอี้ / Chair Sitting</option>
          </select>

          <select name="meditation_preference" className="rounded-lg border p-3">
            <option value="">รูปแบบสมาธิที่ชอบ / Preferred Meditation Style</option>
            <option value="relaxation">ความสบาย / Relaxation</option>
            <option value="breathing">กำหนดลมหายใจ / Breathing Awareness</option>
            <option value="visualization">การนึกภาพ / Visualization</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <select name="photo_consent" className="rounded-lg border p-3 md:col-span-2">
            <option value="">การยินยอมถ่ายภาพ / Photo Consent</option>
            <option value="allowed_not_social">ถ่ายภาพได้ แต่ไม่ลงโซเชียล / Photo allowed, but not for social media</option>
            <option value="no_photo">ไม่ถ่ายภาพ / No photo allowed</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <input
            type="file"
            name="profile_photo"
            accept="image/*"
            className="rounded-lg border p-3 md:col-span-2"
          />

          <textarea name="address" className="rounded-lg border p-3 md:col-span-2" placeholder="ที่อยู่ / Address" rows={3} />
          <textarea name="notes" className="rounded-lg border p-3 md:col-span-2" placeholder="หมายเหตุ / Notes" rows={3} />

          <button disabled={saving} className="rounded-xl bg-green-700 px-6 py-3 text-white md:col-span-2">
            {saving ? "กำลังบันทึก... / Saving..." : "บันทึกข้อมูล / Save Information"}
          </button>
        </form>
      </div>
    </main>
  );
}