"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewStaffPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

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

  async function uploadStaffPhoto() {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `staff-${Date.now()}.${fileExt}`;
    const filePath = `staff/${fileName}`;

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const profilePhotoUrl = await uploadStaffPhoto();

      const payload = {
        full_name: formData.get("full_name"),
        nickname: formData.get("nickname"),
        role: formData.get("role"),
        department: formData.get("department"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        status: formData.get("status"),
        notes: formData.get("notes"),
        profile_photo_url: profilePhotoUrl,
      };

      const { error } = await supabase.from("staff").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      alert("เพิ่ม Staff สำเร็จ / Staff added successfully");
      window.location.href = "/staff";
    } catch (error: any) {
      alert(error.message || "Upload failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-md">
        <a
          href="/staff"
          className="mb-4 inline-block rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
        >
          ← กลับไป Staff Directory
        </a>

        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          Add Staff
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <label className="font-semibold text-[#4b5f4a]">
              Profile Photo
            </label>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Staff preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
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
            placeholder="Full Name"
            required
          />

          <input
            name="nickname"
            className="rounded-lg border p-3"
            placeholder="Nickname"
          />

          <input
            name="role"
            className="rounded-lg border p-3"
            placeholder="Role / หน้าที่"
            required
          />

          <input
            name="department"
            className="rounded-lg border p-3"
            placeholder="Department"
          />

          <input
            name="phone"
            className="rounded-lg border p-3"
            placeholder="Phone"
          />

          <input
            name="email"
            type="email"
            className="rounded-lg border p-3"
            placeholder="Email"
          />

          <select name="status" className="rounded-lg border p-3 md:col-span-2">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <textarea
            name="notes"
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="Notes / รายละเอียดหน้าที่"
            rows={4}
          />

          <button
            type="submit"
            className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 md:col-span-2"
          >
            Save Staff
          </button>
        </form>
      </div>
    </main>
  );
}