"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
    setPhotoFile(null);
  }

  function cancelEdit() {
    setEditingMember(null);
    setPhotoFile(null);
  }

  function updateEditField(field: string, value: string) {
    setEditingMember((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;

    setPhotoFile(file);

    setEditingMember({
      ...editingMember,
      profile_photo_url: URL.createObjectURL(file),
    });
  }

  async function uploadProfilePhoto() {
    if (!photoFile) return editingMember?.profile_photo_url || null;

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

  async function saveMember() {
    if (!editingMember) return;

    setSaving(true);

    try {
      const profilePhotoUrl = await uploadProfilePhoto();

      const { error } = await supabase
        .from("members")
        .update({
          profile_photo_url: profilePhotoUrl,
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

      if (error) throw error;

      alert("บันทึกข้อมูลสมาชิกเรียบร้อย / Member updated");
      setEditingMember(null);
      setPhotoFile(null);
      await loadMembers();
    } catch (error: any) {
      alert(error?.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return members;

    return members.filter((member) => {
      const text = [
        member.full_name,
        member.nickname,
        member.phone,
        member.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [members, search]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ec] px-4 py-6 sm:px-6">
      <MembersBackground />

      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
            <div className="flex flex-wrap gap-3">
              <TopButton href="/" tone="teal">
                🏠 กลับหน้าหลัก
              </TopButton>

              <TopButton href="/members/pdf" target="_blank" tone="rose">
                📄 Export PDF
              </TopButton>

              <TopButton href="/members/trash" tone="orange">
                🗑️ Recycle Bin
              </TopButton>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 shadow-sm backdrop-blur">
                  Member Directory
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-900 sm:text-5xl">
                  รายชื่อสมาชิก / Members List
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  จัดการข้อมูลสมาชิก ค้นหา ดูรายละเอียด และแก้ไขข้อมูลได้อย่างเป็นระเบียบ
                  ในบรรยากาศที่สบายตาและสงบ
                </p>
              </div>

              <div className="grid min-w-[260px] grid-cols-2 gap-3">
                <MiniStat label="สมาชิกทั้งหมด" value={members.length} />
                <MiniStat label="ผลการค้นหา" value={filteredMembers.length} />
              </div>
            </div>

            <div className="mt-7">
              <div className="relative">
                <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl">
                  🔎
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล / Search name, nickname, phone or email"
                  className="h-16 w-full rounded-3xl border border-emerald-100 bg-white/85 pl-14 pr-5 text-base font-medium text-slate-800 shadow-inner outline-none backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={() => startEdit(member)}
            />
          ))}
        </section>

        {filteredMembers.length === 0 && (
          <div className="mt-8 rounded-[2rem] border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
            <div className="text-5xl">🌿</div>
            <h2 className="mt-4 text-2xl font-black text-emerald-900">
              ไม่พบสมาชิก
            </h2>
            <p className="mt-2 text-slate-500">
              ลองเปลี่ยนคำค้นหา หรือเคลียร์ช่องค้นหาอีกครั้ง
            </p>
          </div>
        )}

        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_30px_120px_rgba(15,23,42,0.35)] backdrop-blur-2xl sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl" />
              <div className="pointer-events-none absolute -left-16 bottom-[-90px] h-60 w-60 rounded-full bg-sky-200/35 blur-3xl" />

              <div className="relative">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                      Edit Member
                    </p>

                    <h2 className="mt-4 text-3xl font-black text-emerald-950">
                      แก้ไขข้อมูลสมาชิก
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Edit member profile, contact information, preferences and health notes.
                    </p>
                  </div>

                  <button
                    onClick={cancelEdit}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    ✕ ปิด
                  </button>
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-sky-50/50 p-5 shadow-sm">
                  <label className="font-bold text-emerald-900">
                    Profile Photo
                  </label>

                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner ring-4 ring-white">
                      {editingMember.profile_photo_url ? (
                        <img
                          src={editingMember.profile_photo_url}
                          alt={editingMember.full_name || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">🙏</span>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full rounded-2xl border border-emerald-100 bg-white/80 p-3 text-sm font-medium text-slate-600 shadow-sm file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-emerald-700"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <EditInput
                    value={editingMember.full_name || ""}
                    onChange={(value) => updateEditField("full_name", value)}
                    placeholder="ชื่อ - นามสกุล / Full Name"
                  />

                  <EditInput
                    value={editingMember.nickname || ""}
                    onChange={(value) => updateEditField("nickname", value)}
                    placeholder="ชื่อเล่น / Nickname"
                  />

                  <EditSelect
                    value={editingMember.gender || ""}
                    onChange={(value) => updateEditField("gender", value)}
                    options={[
                      ["", "เพศ / Gender"],
                      ["male", "ชาย / Male"],
                      ["female", "หญิง / Female"],
                      ["other", "อื่น ๆ / Other"],
                    ]}
                  />

                  <EditInput
                    value={editingMember.age || ""}
                    onChange={(value) => updateEditField("age", value)}
                    type="number"
                    placeholder="อายุ / Age"
                  />

                  <EditInput
                    value={editingMember.phone || ""}
                    onChange={(value) => updateEditField("phone", value)}
                    placeholder="เบอร์โทร / Phone"
                  />

                  <EditInput
                    value={editingMember.email || ""}
                    onChange={(value) => updateEditField("email", value)}
                    placeholder="อีเมล / Email"
                  />

                  <EditInput
                    value={editingMember.line_id || ""}
                    onChange={(value) => updateEditField("line_id", value)}
                    placeholder="Line ID"
                  />

                  <EditInput
                    value={editingMember.occupation || ""}
                    onChange={(value) => updateEditField("occupation", value)}
                    placeholder="อาชีพ / Occupation"
                  />

                  <EditSelect
                    value={editingMember.referral_source || ""}
                    onChange={(value) =>
                      updateEditField("referral_source", value)
                    }
                    options={[
                      ["", "รู้จักจากทางไหน / Referral Source"],
                      ["friend", "เพื่อน / Friend"],
                      ["poster", "ป้ายโปรโมท / Poster or Sign"],
                      ["facebook", "Facebook"],
                      ["other", "อื่น ๆ / Other"],
                    ]}
                  />

                  <EditSelect
                    value={editingMember.sitting_preference || ""}
                    onChange={(value) =>
                      updateEditField("sitting_preference", value)
                    }
                    options={[
                      ["", "รูปแบบการนั่ง / Sitting Preference"],
                      ["floor", "นั่งพื้น / Floor Sitting"],
                      ["chair", "นั่งเก้าอี้ / Chair Sitting"],
                    ]}
                  />

                  <EditSelect
                    value={editingMember.meditation_preference || ""}
                    onChange={(value) =>
                      updateEditField("meditation_preference", value)
                    }
                    options={[
                      ["", "รูปแบบสมาธิที่ชอบ"],
                      ["relaxation", "ความผ่อนคลาย / Relaxation"],
                      ["breathing", "กำหนดลมหายใจ / Breathing Awareness"],
                      ["visualization", "การนึกภาพ / Visualization"],
                      ["reduce_stress", "ลดความเครียด / Reduce Stress"],
                      ["mental_charity", "เมตตาภาวนา / Mental Charity"],
                      ["walking_meditation", "เดินจงกรม / Walking Meditation"],
                      ["happiness", "ความสุข / Happiness"],
                      ["other", "อื่น ๆ / Other"],
                    ]}
                  />

                  <EditSelect
                    value={editingMember.health_concern || ""}
                    onChange={(value) =>
                      updateEditField("health_concern", value)
                    }
                    options={[
                      ["", "ปัญหาสุขภาพ / Health Concern"],
                      ["none", "ไม่มี / None"],
                      ["back_pain", "ปวดหลัง / Back Pain"],
                      ["knee_pain", "ปวดเข่า / Knee Pain"],
                      ["other", "อื่น ๆ / Other"],
                    ]}
                  />

                  <textarea
                    value={editingMember.address || ""}
                    onChange={(e) =>
                      updateEditField("address", e.target.value)
                    }
                    className="min-h-28 rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:col-span-2"
                    placeholder="ที่อยู่ / Address"
                    rows={3}
                  />
                </div>

                <div className="mt-7 flex flex-col justify-end gap-3 sm:flex-row">
                  <button
                    onClick={cancelEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    ยกเลิก / Cancel
                  </button>

                  <button
                    onClick={saveMember}
                    disabled={saving}
                    className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึก / Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MembersBackground() {
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
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-20">🌿</div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-20">🌸</div>
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

function MemberCard({ member, onEdit }: { member: any; onEdit: () => void }) {
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/92 hover:shadow-[0_28px_85px_rgba(15,23,42,0.16)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/35 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-sky-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-10 transition group-hover:opacity-20">
        🌿
      </div>

      <div className="relative">
        <div className="flex items-center gap-4">
          <MemberAvatar member={member} />

          <div className="min-w-0">
            <h3 className="truncate text-xl font-black tracking-tight text-emerald-950">
              {member.full_name || "-"}
            </h3>

            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {member.nickname || "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl border border-emerald-50 bg-white/60 p-4 text-sm shadow-inner">
          <InfoRow label="Phone" value={member.phone || "-"} />
          <InfoRow label="Email" value={member.email || "-"} />
          <InfoRow label="Occupation" value={member.occupation || "-"} />
        </div>

        <div className="mt-5 flex gap-2">
          <a
            href={`/members/${member.id}`}
            className="rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg"
          >
            ดูข้อมูล
          </a>

          <button
            onClick={onEdit}
            className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
          >
            แก้ไข
          </button>
        </div>
      </div>
    </article>
  );
}

function MemberAvatar({ member }: { member: any }) {
  if (member.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || ""}
        className="h-20 w-20 shrink-0 rounded-full object-cover shadow-md ring-4 ring-white"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-sky-50 text-4xl shadow-inner ring-4 ring-white">
      🙏
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-2">
      <strong className="shrink-0 text-slate-900">{label}:</strong>
      <span className="min-w-0 truncate text-slate-600">{value}</span>
    </p>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-emerald-700">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function TopButton({
  href,
  target,
  tone,
  children,
}: {
  href: string;
  target?: "_blank";
  tone: "teal" | "rose" | "orange";
  children: React.ReactNode;
}) {
  const tones = {
    teal: "from-teal-500 to-emerald-500 shadow-emerald-100 hover:shadow-emerald-200",
    rose: "from-rose-600 to-red-600 shadow-rose-100 hover:shadow-rose-200",
    orange:
      "from-orange-600 to-amber-600 shadow-orange-100 hover:shadow-orange-200",
  };

  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={`rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${tones[tone]}`}
    >
      {children}
    </a>
  );
}

function EditInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
      placeholder={placeholder}
    />
  );
}

function EditSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-emerald-100 bg-white/85 p-4 font-medium text-slate-800 outline-none shadow-sm backdrop-blur focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
    >
      {options.map(([optionValue, label]) => (
        <option key={`${optionValue}-${label}`} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}