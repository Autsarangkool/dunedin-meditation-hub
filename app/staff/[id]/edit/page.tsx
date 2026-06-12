"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StaffForm = {
  full_name: string;
  nickname: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
  profile_photo_url: string;
};

export default function EditStaffPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState<StaffForm>({
    full_name: "",
    nickname: "",
    role: "",
    department: "",
    phone: "",
    email: "",
    status: "active",
    notes: "",
    profile_photo_url: "",
  });

  useEffect(() => {
    async function loadStaff() {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setForm({
        full_name: data.full_name || "",
        nickname: data.nickname || "",
        role: data.role || "",
        department: data.department || "",
        phone: data.phone || "",
        email: data.email || "",
        status: data.status || "active",
        notes: data.notes || "",
        profile_photo_url: data.profile_photo_url || "",
      });

      setLoading(false);
    }

    if (id) loadStaff();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setForm({
      ...form,
      profile_photo_url: URL.createObjectURL(file),
    });
  }

  async function uploadStaffPhoto() {
    if (!photoFile) return form.profile_photo_url || null;

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

    try {
      const profilePhotoUrl = await uploadStaffPhoto();

      const payload = {
        full_name: form.full_name,
        nickname: form.nickname,
        role: form.role,
        department: form.department,
        phone: form.phone,
        email: form.email,
        status: form.status,
        notes: form.notes,
        profile_photo_url: profilePhotoUrl,
      };

      const { error } = await supabase
        .from("staff")
        .update(payload)
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      alert("อัปเดตข้อมูล Staff สำเร็จ");
      window.location.href = "/staff";
    } catch (error: any) {
      alert(error.message || "Upload failed");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ea] p-6">
        <p>Loading...</p>
      </main>
    );
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
          Edit Staff
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-2xl border bg-[#fffdf8] p-5">
            <label className="font-semibold text-[#4b5f4a]">
              Profile Photo
            </label>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {form.profile_photo_url ? (
                  <img
                    src={form.profile_photo_url}
                    alt={form.full_name}
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
            value={form.full_name}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Full Name"
            required
          />

          <input
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Nickname"
          />

          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Role / หน้าที่"
            required
          />

          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Department"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Phone"
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-lg border p-3"
            placeholder="Email"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-lg border p-3 md:col-span-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="rounded-lg border p-3 md:col-span-2"
            placeholder="Notes / รายละเอียดหน้าที่"
            rows={4}
          />

          <button
            type="submit"
            className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 md:col-span-2"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  );
}