"use client";

import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  async function handleSubmit(e: any) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      full_name: formData.get("full_name"),
      nickname: formData.get("nickname"),
      gender: formData.get("gender"),
      birth_date: formData.get("birth_date"),
      age: formData.get("age"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      line_id: formData.get("line_id"),
      occupation: formData.get("occupation"),
      referral_source: formData.get("referral_source"),
      sitting_preference: formData.get("sitting_preference"),
      meditation_preference: formData.get("meditation_preference"),
      health_concern: formData.get("health_concern"),
    };

    const { error } = await supabase.from("members").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    alert("ลงทะเบียนสำเร็จ / Registration successful");
    form.reset();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-md">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          ลงทะเบียนสมาชิกใหม่ / New Member Registration
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
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

          <div>
            <label className="mb-1 block text-sm text-gray-600">
              วันเกิด / Date of Birth (DD/MM/YYYY)
            </label>
            <input
              name="birth_date"
              type="date"
              lang="en-NZ"
              className="w-full rounded-lg border p-3"
            />
          </div>

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