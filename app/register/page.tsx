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

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("member-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const profilePhotoUrl = await uploadProfilePhoto();

      const payload = {
        full_name: formData.get("full_name"),
        nickname: formData.get("nickname"),
        gender: formData.get("gender"),
        birth_date: convertDateToISO(formData.get("birth_date") as string),
        age: formData.get("age"),
        ? Number(formData.get("age"))
  : null,
        phone: formData.get("phone"),
        email: formData.get("email"),
        line_id: formData.get("line_id"),
        address: formData.get("address"),
        occupation: formData.get("occupation"),
        referral_source: formData.get("referral_source"),
        sitting_preference: formData.get("sitting_preference"),
        meditation_preference: formData.get("meditation_preference"),
        health_concern: formData.get("health_concern"),
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
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          ลงทะเบียนสมาชิกใหม่ / New Member Registration
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
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
          </div>

          <input
            name="full_name"
            className="rounded-lg border p-3"
            placeholder="ชื่อ - นามสกุล / Full Name"
            required
          />

          <input
            name="nickname"
            className="rounded-lg border p-3"
            placeholder="ชื่อเล่น / Nickname"
          />

          <select name="gender" className="rounded-lg border p-3">
            <option value="">เพศ / Gender</option>
            <option value="male">ชาย / Male</option>
            <option value="female">หญิง / Female</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <input
            name="birth_date"
            type="text"
            inputMode="numeric"
            placeholder="วันเกิด DD/MM/YYYY เช่น 02/04/1995"
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$"
            className="rounded-lg border p-3"
          />

          <input
            name="age"
            className="rounded-lg border p-3"
            type="number"
            placeholder="อายุ / Age"
          />

          <input
            name="phone"
            className="rounded-lg border p-3"
            type="tel"
            placeholder="เบอร์โทร / Phone Number"
          />

          <input
            name="email"
            className="rounded-lg border p-3"
            type="email"
            placeholder="อีเมล / Email"
          />

          <input
            name="line_id"
            className="rounded-lg border p-3"
            placeholder="Line ID"
          />

          <textarea
            name="address"
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="ที่อยู่ / Address"
            rows={3}
          />

          <input
            name="occupation"
            className="rounded-lg border p-3"
            placeholder="อาชีพ / Occupation"
          />

          <select name="referral_source" className="rounded-lg border p-3">
            <option value="">รู้จักจากทางไหน / How did you hear about us?</option>
            <option value="friend">เพื่อน / Friend</option>
            <option value="poster">ป้ายโปรโมท / Poster or Sign</option>
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
            <option value="relaxation">ความผ่อนคลาย / Relaxation</option>
            <option value="breathing">กำหนดลมหายใจ / Breathing Awareness</option>
            <option value="visualization">การนึกภาพ / Visualization</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

          <select
            name="health_concern"
            className="rounded-lg border p-3 md:col-span-2"
          >
            <option value="">มีปัญหาสุขภาพไหม / Any health concerns?</option>
            <option value="none">ไม่มี / None</option>
            <option value="back_pain">ปวดหลัง / Back Pain</option>
            <option value="knee_pain">ปวดเข่า / Knee Pain</option>
            <option value="other">อื่น ๆ / Other</option>
          </select>

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