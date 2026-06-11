"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      loadMembers();
    }

    checkSession();
  }, [router]);

  async function loadMembers() {
    const { data, error } = await supabase
  .from("members")
  .select("*")
  .eq("is_deleted", false);

    if (error) {
      alert(error.message);
      return;
    }

    const sortedMembers = (data || []).sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || "", ["en", "th"], {
        sensitivity: "base",
      })
    );

    setMembers(sortedMembers);
  }

  function startEdit(member: any) {
    setEditingMember({ ...member });
  }

  function cancelEdit() {
    setEditingMember(null);
  }

  function updateEditField(field: string, value: string) {
    setEditingMember((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveMember() {
    if (!editingMember) return;

    setSaving(true);

    const { error } = await supabase
      .from("members")
      .update({
        full_name: editingMember.full_name || null,
        nickname: editingMember.nickname || null,
        gender: editingMember.gender || null,
        age: editingMember.age ? Number(editingMember.age) : null,
        phone: editingMember.phone || null,
        email: editingMember.email || null,
        line_id: editingMember.line_id || null,
        address: editingMember.address || null,
        occupation: editingMember.occupation || null,
        referral_source: editingMember.referral_source || null,
        sitting_preference: editingMember.sitting_preference || null,
        meditation_preference: editingMember.meditation_preference || null,
        health_concern: editingMember.health_concern || null,
      })
      .eq("id", editingMember.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("บันทึกข้อมูลสมาชิกเรียบร้อย / Member updated");
    setEditingMember(null);
    await loadMembers();
  }

  const filteredMembers = members.filter((member) => {
    const keyword = search.toLowerCase();

    return (
      member.full_name?.toLowerCase().includes(keyword) ||
      member.nickname?.toLowerCase().includes(keyword) ||
      member.phone?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-[#f7f3ea] p-6">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-md">
        <div className="mb-4 flex flex-wrap gap-3">
         
          <a
            href="/"
            className="rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-teal-700"
          >
            🏠 กลับหน้าหลัก
          </a>

          <a
            href="/members/pdf"
            target="_blank"
            className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700"
          >
            📄 Export PDF
          </a>

          <a
  href="/members/trash"
  className="rounded-xl bg-orange-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-orange-700"
>
  🗑️ Recycle Bin
</a>
        </div>

        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          รายชื่อสมาชิก / Members List
        </h1>

        <p className="mt-2 text-gray-600">
          สมาชิกทั้งหมด / Total Members: {filteredMembers.length}
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล / Search name, nickname, phone or email"
          className="mt-6 w-full rounded-xl border p-3"
        />

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-[#f7f3ea]">
                <th className="p-3">รูป / Photo</th>
                <th className="p-3">ชื่อ / Name</th>
                <th className="p-3">ชื่อเล่น / Nickname</th>
                <th className="p-3">โทร / Phone</th>
                <th className="p-3">อีเมล / Email</th>
                <th className="p-3">จัดการ / Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="p-3">
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt={member.full_name || ""}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                        🙏
                      </div>
                    )}
                  </td>

                  <td className="p-3">{member.full_name || "-"}</td>
                  <td className="p-3">{member.nickname || "-"}</td>
                  <td className="p-3">{member.phone || "-"}</td>
                  <td className="p-3">{member.email || "-"}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/members/${member.id}`}
                        className="rounded-lg bg-green-700 px-3 py-2 text-white hover:bg-green-800"
                      >
                        ดูข้อมูล
                      </a>

                      <button
                        onClick={() => startEdit(member)}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-white hover:bg-blue-800"
                      >
                        แก้ไข
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    ไม่พบสมาชิก / No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-[#4b5f4a]">
                แก้ไขข้อมูลสมาชิก / Edit Member
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={editingMember.full_name || ""}
                  onChange={(e) => updateEditField("full_name", e.target.value)}
                  className="rounded-lg border p-3"
                  placeholder="ชื่อ - นามสกุล / Full Name"
                />

                <input
                  value={editingMember.nickname || ""}
                  onChange={(e) => updateEditField("nickname", e.target.value)}
                  className="rounded-lg border p-3"
                  placeholder="ชื่อเล่น / Nickname"
                />

                <select
                  value={editingMember.gender || ""}
                  onChange={(e) => updateEditField("gender", e.target.value)}
                  className="rounded-lg border p-3"
                >
                  <option value="">เพศ / Gender</option>
                  <option value="male">ชาย / Male</option>
                  <option value="female">หญิง / Female</option>
                  <option value="other">อื่น ๆ / Other</option>
                </select>

                <input
                  value={editingMember.age || ""}
                  onChange={(e) => updateEditField("age", e.target.value)}
                  className="rounded-lg border p-3"
                  type="number"
                  placeholder="อายุ / Age"
                />

                <input
                  value={editingMember.phone || ""}
                  onChange={(e) => updateEditField("phone", e.target.value)}
                  className="rounded-lg border p-3"
                  placeholder="เบอร์โทร / Phone"
                />

                <input
                  value={editingMember.email || ""}
                  onChange={(e) => updateEditField("email", e.target.value)}
                  className="rounded-lg border p-3"
                  placeholder="อีเมล / Email"
                />

                <input
                  value={editingMember.line_id || ""}
                  onChange={(e) => updateEditField("line_id", e.target.value)}
                  className="rounded-lg border p-3"
                  placeholder="Line ID"
                />

                <input
                  value={editingMember.occupation || ""}
                  onChange={(e) =>
                    updateEditField("occupation", e.target.value)
                  }
                  className="rounded-lg border p-3"
                  placeholder="อาชีพ / Occupation"
                />

                <select
                  value={editingMember.referral_source || ""}
                  onChange={(e) =>
                    updateEditField("referral_source", e.target.value)
                  }
                  className="rounded-lg border p-3"
                >
                  <option value="">รู้จักจากทางไหน / Referral Source</option>
                  <option value="friend">เพื่อน / Friend</option>
                  <option value="poster">ป้ายโปรโมท / Poster or Sign</option>
                  <option value="facebook">Facebook</option>
                  <option value="other">อื่น ๆ / Other</option>
                </select>

                <select
                  value={editingMember.sitting_preference || ""}
                  onChange={(e) =>
                    updateEditField("sitting_preference", e.target.value)
                  }
                  className="rounded-lg border p-3"
                >
                  <option value="">รูปแบบการนั่ง / Sitting Preference</option>
                  <option value="floor">นั่งพื้น / Floor Sitting</option>
                  <option value="chair">นั่งเก้าอี้ / Chair Sitting</option>
                </select>

                <select
                  value={editingMember.meditation_preference || ""}
                  onChange={(e) =>
                    updateEditField("meditation_preference", e.target.value)
                  }
                  className="rounded-lg border p-3"
                >
                  <option value="">รูปแบบสมาธิที่ชอบ</option>
                  <option value="relaxation">ความผ่อนคลาย / Relaxation</option>
                  <option value="breathing">
                    กำหนดลมหายใจ / Breathing Awareness
                  </option>
                  <option value="visualization">
                    การนึกภาพ / Visualization
                  </option>
                  <option value="reduce_stress">
                    ลดความเครียด / Reduce Stress
                  </option>
                  <option value="mental_charity">
                    เมตตาภาวนา / Mental Charity
                  </option>
                  <option value="walking_meditation">
                    เดินจงกรม / Walking Meditation
                  </option>
                  <option value="happiness">ความสุข / Happiness</option>
                  <option value="other">อื่น ๆ / Other</option>
                </select>

                <select
                  value={editingMember.health_concern || ""}
                  onChange={(e) =>
                    updateEditField("health_concern", e.target.value)
                  }
                  className="rounded-lg border p-3"
                >
                  <option value="">ปัญหาสุขภาพ / Health Concern</option>
                  <option value="none">ไม่มี / None</option>
                  <option value="back_pain">ปวดหลัง / Back Pain</option>
                  <option value="knee_pain">ปวดเข่า / Knee Pain</option>
                  <option value="other">อื่น ๆ / Other</option>
                </select>

                <textarea
                  value={editingMember.address || ""}
                  onChange={(e) => updateEditField("address", e.target.value)}
                  className="rounded-lg border p-3 md:col-span-2"
                  placeholder="ที่อยู่ / Address"
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={cancelEdit}
                  className="rounded-xl border px-5 py-3 font-semibold hover:bg-gray-100"
                >
                  ยกเลิก / Cancel
                </button>

                <button
                  onClick={saveMember}
                  disabled={saving}
                  className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:bg-gray-400"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก / Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}