"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  code_number: string | null;
  full_name: string | null;
  nickname: string | null;
  gender: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  address: string | null;
  occupation: string | null;
  referral_source: string | null;
  sitting_preference: string | null;
  meditation_preference: string | null;
  health_concern: string | null;
  profile_photo_url: string | null;
  created_at: string | null;
  is_deleted?: boolean | null;
};

type EditingMember = Omit<Member, "age"> & {
  age: number | string | null;
};


export default function MembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      await loadMembers();
    }

    checkSession();
  }, [router]);

  async function loadMembers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMembers((data || []) as Member[]);
  }

  function startEdit(member: Member, registrationOrder: number) {
    setEditingMember({
      ...member,
      code_number:
        member.code_number || createMemberDisplayId(registrationOrder),
    });
    setPhotoFile(null);
  }

  function cancelEdit() {
    setEditingMember(null);
    setPhotoFile(null);
  }

  function updateEditField(field: string, value: string) {
    setEditingMember((previous) =>
      previous
        ? ({
            ...previous,
            [field]: value,
          } as EditingMember)
        : null
    );
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editingMember) return;

    setPhotoFile(file);

    setEditingMember({
      ...editingMember,
      profile_photo_url: URL.createObjectURL(file),
    });
  }

  async function uploadProfilePhoto() {
    if (!photoFile) {
      return editingMember?.profile_photo_url || null;
    }

    const fileExtension = photoFile.name.split(".").pop() || "jpg";
    const fileName = `member-${Date.now()}.${fileExtension}`;
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
          code_number: emptyToNull(editingMember.code_number),
          profile_photo_url: profilePhotoUrl,
          ...(editingMember.created_at
            ? { created_at: editingMember.created_at }
            : {}),
          full_name: emptyToNull(editingMember.full_name),
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
          meditation_preference:
            editingMember.meditation_preference || null,
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

  const registrationOrderMap = useMemo(() => {
    const orderedMembers = [...members].sort((first, second) => {
      const firstTime = getRegistrationTimestamp(first.created_at);
      const secondTime = getRegistrationTimestamp(second.created_at);

      if (firstTime !== secondTime) return firstTime - secondTime;

      return first.id.localeCompare(second.id);
    });

    return new Map(
      orderedMembers.map((member, index) => [member.id, index + 1])
    );
  }, [members]);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return members
      .filter((member) => {
        const registrationOrder =
          registrationOrderMap.get(member.id) || 0;
        const displayMemberId =
          member.code_number ||
          createMemberDisplayId(registrationOrder);

        if (!keyword) return true;

        const searchableText = [
          displayMemberId,
          member.full_name,
          member.nickname,
          member.phone,
          member.email,
          member.occupation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });
  }, [members, registrationOrderMap, search]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-7">
      <MembersBackground />

      <div className="relative z-10 mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[2.4rem] border border-sky-100/90 bg-white/82 p-5 shadow-[0_30px_95px_rgba(56,189,248,0.16)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.72),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(167,243,208,0.38),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.95),rgba(239,249,255,0.80))]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-90px] h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[390px] lg:block xl:w-[470px]">
            <MembersWinterIllustration />
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-3">
              <TopButton href="/" tone="blue">
                🏠 กลับหน้าหลัก
              </TopButton>

              <TopButton href="/members/pdf" target="_blank" tone="sky">
                📄 Export PDF
              </TopButton>

              <TopButton href="/members/trash" tone="rose">
                🗑️ Recycle Bin
              </TopButton>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:max-w-[66%] lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600 shadow-sm backdrop-blur">
                  ❄️ Member Directory
                </p>

                <h1 className="winter-title mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  รายชื่อสมาชิก
                </h1>

                <p className="mt-2 text-xl font-black text-sky-700">
                  Members List
                </p>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
                  เรียงตาม Member ID จากน้อยไปมาก
                  โดยสมาชิกที่สมัครภายหลังจะแสดงอยู่ด้านล่าง
                </p>
              </div>
            </div>

            <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2">
              <MiniStat label="สมาชิกทั้งหมด" value={members.length} icon="👥" />
              <MiniStat
                label="ผลการค้นหา"
                value={filteredMembers.length}
                icon="🔎"
              />
            </div>

            <div className="mt-7 max-w-4xl">
              <div className="relative overflow-hidden rounded-[1.6rem] border border-sky-200/80 bg-white/86 p-2 shadow-[0_16px_42px_rgba(14,165,233,0.13)] backdrop-blur transition focus-within:-translate-y-0.5 focus-within:border-sky-400 focus-within:shadow-[0_20px_55px_rgba(14,165,233,0.20)]">
                <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/45 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 text-xl shadow-sm">
                    🔎
                  </div>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหา Member ID ชื่อ ชื่อเล่น เบอร์โทร หรืออีเมล..."
                    className="h-14 min-w-0 flex-1 bg-transparent px-1 text-base font-bold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="mt-8 rounded-[2rem] border border-sky-100 bg-white/75 px-6 py-14 text-center shadow-lg backdrop-blur-xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
            <p className="mt-4 font-bold text-slate-500">Loading members...</p>
          </div>
        ) : (
          <>
            <section className="mt-8 space-y-4">
              {filteredMembers.map((member) => {
                const registrationOrder =
                  registrationOrderMap.get(member.id) || 0;

                return (
                  <MemberCard
                    key={member.id}
                    member={member}
                    registrationOrder={registrationOrder}
                    onEdit={() => startEdit(member, registrationOrder)}
                  />
                );
              })}
            </section>

            {filteredMembers.length === 0 && (
              <div className="mt-8 rounded-[2rem] border border-dashed border-sky-200 bg-white/72 px-6 py-12 text-center shadow-sm backdrop-blur-xl">
                <div className="mx-auto w-44">
                  <EmptyWinterIllustration />
                </div>
                <h2 className="winter-title mt-4 text-2xl font-black">
                  ไม่พบสมาชิก
                </h2>
                <p className="mt-2 font-medium text-slate-500">
                  ลองเปลี่ยนคำค้นหา หรือกดปุ่ม ✕ เพื่อล้างช่องค้นหา
                </p>
              </div>
            )}
          </>
        )}

        {editingMember && (
          <EditMemberModal
            editingMember={editingMember}
            saving={saving}
            onCancel={cancelEdit}
            onSave={saveMember}
            onPhotoChange={handlePhotoChange}
            onFieldChange={updateEditField}
          />
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
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute left-[16%] top-[-140px] h-[480px] w-[590px] rounded-full bg-cyan-200/34 blur-3xl" />
        <div className="absolute -left-28 bottom-10 h-[520px] w-[520px] rounded-full bg-blue-100/55 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[20%] h-[540px] w-[540px] rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="absolute right-12 top-28 text-6xl opacity-20">❄️</div>
        <div className="absolute left-[12%] bottom-28 text-6xl opacity-16">🌲</div>
        <div className="absolute right-[20%] bottom-20 text-5xl opacity-16">☃️</div>
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

function MembersWinterIllustration() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="h-auto w-full drop-shadow-[0_20px_28px_rgba(56,189,248,0.16)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="memberSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9f8ff" />
          <stop offset="58%" stopColor="#c8edff" />
          <stop offset="100%" stopColor="#edfff8" />
        </linearGradient>
        <linearGradient id="memberSnow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#def3ff" />
        </linearGradient>
      </defs>

      <path
        d="M20 215 110 115l65 63 72-104 98 111 60-58 95 82v91H20Z"
        fill="url(#memberSky)"
      />
      <path
        d="M20 235c86-37 154-31 221 3 70 36 144 36 259-4v66H20Z"
        fill="url(#memberSnow)"
      />

      <g transform="translate(300 143)">
        <rect x="18" y="50" width="104" height="70" rx="9" fill="#d68c58" />
        <path d="M6 59 70 12l65 47Z" fill="#925a46" />
        <path d="M6 59 70 12l65 47-8 5-57-41-56 41Z" fill="#ffffff" />
        <rect x="59" y="80" width="24" height="40" rx="3" fill="#6c4234" />
        <rect x="31" y="74" width="18" height="18" rx="3" fill="#ffe6a4" />
        <rect x="94" y="74" width="18" height="18" rx="3" fill="#ffe6a4" />
      </g>

      <g transform="translate(405 166)">
        <circle cx="34" cy="65" r="30" fill="#ffffff" />
        <circle cx="34" cy="27" r="22" fill="#ffffff" />
        <circle cx="27" cy="24" r="3" fill="#23496c" />
        <circle cx="42" cy="24" r="3" fill="#23496c" />
        <path d="m34 30 12 4-12 4Z" fill="#ff9f43" />
        <path
          d="M21 38c9 7 18 7 27 0"
          fill="none"
          stroke="#55b7cf"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M17 14c5-19 29-21 37-3l-5 6H21Z" fill="#4a91df" />
      </g>

      <g fill="#68add5">
        <path d="M63 250 84 207l21 43Z" />
        <path d="M70 228 84 195l15 33Z" />
        <rect x="81" y="247" width="6" height="20" rx="3" />

        <path d="M180 265 202 219l22 46Z" />
        <path d="M187 241 202 206l15 35Z" />
        <rect x="199" y="262" width="6" height="20" rx="3" />
      </g>

      {[75, 145, 220, 292, 372, 456].map((x, index) => (
        <g
          key={x}
          transform={`translate(${x} ${index % 2 ? 58 : 38})`}
          opacity="0.72"
        >
          <path
            d="M0-11V11M-11 0H11M-7-7 7 7M7-7-7 7"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}

function MemberCard({
  member,
  registrationOrder,
  onEdit,
}: {
  member: Member;
  registrationOrder: number;
  onEdit: () => void;
}) {
  const memberId =
    member.code_number || createMemberDisplayId(registrationOrder);

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-sky-100/85 bg-white/82 p-5 shadow-[0_18px_58px_rgba(56,189,248,0.10)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white/95 hover:shadow-[0_24px_74px_rgba(56,189,248,0.17)] sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl transition group-hover:scale-125" />
      <div className="pointer-events-none absolute -left-14 bottom-[-60px] h-40 w-40 rounded-full bg-emerald-200/28 blur-3xl" />
      <div className="pointer-events-none absolute bottom-5 right-6 text-4xl opacity-[0.08] transition group-hover:opacity-20">
        ❄️
      </div>

      <div className="relative grid gap-5 xl:grid-cols-[minmax(300px,1.15fr)_minmax(430px,1.65fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <MemberAvatar member={member} />

            <span className="absolute -bottom-2 -right-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-sky-500 px-2 text-[11px] font-black text-white shadow-md">
              #{registrationOrder || "-"}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-sky-700">
                🪪 {memberId}
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                สมาชิกคนที่ {registrationOrder || "-"}
              </span>
            </div>

            <h3 className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
              {member.full_name || "-"}
            </h3>

            <p className="mt-1 truncate text-sm font-bold text-sky-600">
              {member.nickname || "Member"}
            </p>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              สมัครเมื่อ {formatRegistrationDate(member.created_at)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.45rem] border border-sky-100/75 bg-white/68 p-4 shadow-inner backdrop-blur sm:grid-cols-2">
          <InfoRow icon="📞" label="Phone" value={member.phone || "-"} />
          <InfoRow icon="✉️" label="Email" value={member.email || "-"} />
          <InfoRow
            icon="💼"
            label="Occupation"
            value={member.occupation || "-"}
          />
          <InfoRow
            icon="📅"
            label="Registered"
            value={formatRegistrationDate(member.created_at)}
          />
        </div>

        <div className="flex flex-wrap gap-2 xl:flex-col xl:items-stretch">
          <Link
            href={`/members/${member.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-sky-500 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-sky-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
          >
            ดูข้อมูล
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-100 transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
          >
            แก้ไข
          </button>
        </div>
      </div>
    </article>
  );
}

function MemberAvatar({ member }: { member: Member }) {
  if (member.profile_photo_url) {
    return (
      <img
        src={member.profile_photo_url}
        alt={member.full_name || "Member"}
        className="h-20 w-20 shrink-0 rounded-full object-cover shadow-md ring-4 ring-white"
      />
    );
  }

  const initials = String(member.full_name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400 text-xl font-black text-white shadow-md ring-4 ring-white">
      {initials || "?"}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <strong className="shrink-0 text-slate-800">{label}:</strong>
      <span className="min-w-0 truncate text-slate-500">{value}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-sky-100/90 bg-white/78 p-4 shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-100 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 text-xl shadow-inner ring-1 ring-sky-100">
          {icon}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-0.5 text-3xl font-black text-sky-700">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
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
  tone: "blue" | "sky" | "rose";
  children: ReactNode;
}) {
  const tones = {
    blue: "from-blue-500 to-sky-500 shadow-sky-100",
    sky: "from-sky-500 to-cyan-500 shadow-cyan-100",
    rose: "from-rose-500 to-red-500 shadow-rose-100",
  };

  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl ${tones[tone]}`}
    >
      {children}
    </Link>
  );
}

function EditMemberModal({
  editingMember,
  saving,
  onCancel,
  onSave,
  onPhotoChange,
  onFieldChange,
}: {
  editingMember: EditingMember;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-md sm:p-5">
      <div className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-sky-100 bg-white/96 p-5 shadow-[0_34px_130px_rgba(15,23,42,0.36)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-[-90px] h-60 w-60 rounded-full bg-emerald-200/35 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-700">
                ❄️ Edit Member
              </p>

              <h2 className="winter-title mt-4 text-3xl font-black">
                แก้ไขข้อมูลสมาชิก
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Edit profile, contact details, preferences and health notes.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ✕ ปิด
            </button>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/50 p-5 shadow-sm">
            <label className="font-black text-sky-900">Profile Photo</label>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner ring-4 ring-white">
                {editingMember.profile_photo_url ? (
                  <img
                    src={editingMember.profile_photo_url}
                    alt={editingMember.full_name || "Member"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">🙏</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="w-full rounded-2xl border border-sky-100 bg-white/85 p-3 text-sm font-medium text-slate-600 shadow-sm file:mr-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-sky-500 file:px-4 file:py-2 file:font-black file:text-white hover:file:brightness-105"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <EditInput
              value={editingMember.code_number || ""}
              onChange={(value) => onFieldChange("code_number", value)}
              placeholder="Member ID เช่น DMH-0001"
            />

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <label
                htmlFor="created_at"
                className="text-xs font-black uppercase tracking-[0.14em] text-sky-600"
              >
                วันที่สมัคร / Registered
              </label>

              <input
                id="created_at"
                type="datetime-local"
                step={60}
                value={toAucklandDateTimeLocalValue(
                  editingMember.created_at
                )}
                onChange={(event) =>
                  onFieldChange(
                    "created_at",
                    event.target.value
                      ? aucklandDateTimeLocalToIso(event.target.value)
                      : ""
                  )
                }
                className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 font-bold text-slate-700 outline-none shadow-sm transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />

              <p className="mt-2 text-xs font-semibold text-slate-500">
                เวลา Dunedin / Pacific/Auckland
              </p>
            </div>

            <EditInput
              value={editingMember.full_name || ""}
              onChange={(value) => onFieldChange("full_name", value)}
              placeholder="ชื่อ - นามสกุล / Full Name"
            />

            <EditInput
              value={editingMember.nickname || ""}
              onChange={(value) => onFieldChange("nickname", value)}
              placeholder="ชื่อเล่น / Nickname"
            />

            <EditSelect
              value={editingMember.gender || ""}
              onChange={(value) => onFieldChange("gender", value)}
              options={[
                ["", "เพศ / Gender"],
                ["male", "ชาย / Male"],
                ["female", "หญิง / Female"],
                ["other", "อื่น ๆ / Other"],
              ]}
            />

            <EditInput
              value={editingMember.age || ""}
              onChange={(value) => onFieldChange("age", value)}
              type="number"
              placeholder="อายุ / Age"
            />

            <EditInput
              value={editingMember.phone || ""}
              onChange={(value) => onFieldChange("phone", value)}
              placeholder="เบอร์โทร / Phone"
            />

            <EditInput
              value={editingMember.email || ""}
              onChange={(value) => onFieldChange("email", value)}
              placeholder="อีเมล / Email"
            />

            <EditInput
              value={editingMember.line_id || ""}
              onChange={(value) => onFieldChange("line_id", value)}
              placeholder="Line ID"
            />

            <EditInput
              value={editingMember.occupation || ""}
              onChange={(value) => onFieldChange("occupation", value)}
              placeholder="อาชีพ / Occupation"
            />

            <EditSelect
              value={editingMember.referral_source || ""}
              onChange={(value) => onFieldChange("referral_source", value)}
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
                onFieldChange("sitting_preference", value)
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
                onFieldChange("meditation_preference", value)
              }
              options={[
                ["", "รูปแบบสมาธิที่ชอบ"],
                ["relaxation", "ความผ่อนคลาย / Relaxation"],
                ["breathing", "กำหนดลมหายใจ / Breathing Awareness"],
                ["visualization", "การนึกภาพ / Visualization"],
                ["reduce_stress", "ลดความเครียด / Reduce Stress"],
                ["mental_charity", "เมตตาภาวนา / Mental Charity"],
                [
                  "walking_meditation",
                  "เดินจงกรม / Walking Meditation",
                ],
                ["happiness", "ความสุข / Happiness"],
                ["other", "อื่น ๆ / Other"],
              ]}
            />

            <EditSelect
              value={editingMember.health_concern || ""}
              onChange={(value) => onFieldChange("health_concern", value)}
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
              onChange={(event) =>
                onFieldChange("address", event.target.value)
              }
              className="min-h-28 rounded-2xl border border-sky-100 bg-white/88 p-4 font-semibold text-slate-800 outline-none shadow-sm placeholder:font-medium placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 md:col-span-2"
              placeholder="ที่อยู่ / Address"
              rows={3}
            />
          </div>

          <div className="mt-7 flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ยกเลิก / Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="winter-button px-7"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก / Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-sky-100 bg-white/88 p-4 font-semibold text-slate-800 outline-none shadow-sm placeholder:font-medium placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
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
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-sky-100 bg-white/88 p-4 font-semibold text-slate-800 outline-none shadow-sm focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    >
      {options.map(([optionValue, label]) => (
        <option key={`${optionValue}-${label}`} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}


function emptyToNull(value: string | null | undefined) {
  const text = String(value || "").trim();

  return text || null;
}

function createMemberDisplayId(registrationOrder: number) {
  return `DMH-${String(registrationOrder || 0).padStart(4, "0")}`;
}

function getRegistrationTimestamp(value?: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

const AUCKLAND_TIME_ZONE = "Pacific/Auckland";

function getAucklandDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AUCKLAND_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function toAucklandDateTimeLocalValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = getAucklandDateTimeParts(date);
  const pad = (number: number) => String(number).padStart(2, "0");

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(
    parts.hour
  )}:${pad(parts.minute)}`;
}

function aucklandDateTimeLocalToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) return value;

  const [, year, month, day, hour, minute] = match;
  const targetAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0
  );

  let candidate = targetAsUtc;

  // ปรับซ้ำเพื่อให้รองรับการเปลี่ยนเวลา Daylight Saving ของนิวซีแลนด์
  for (let index = 0; index < 3; index += 1) {
    const parts = getAucklandDateTimeParts(new Date(candidate));
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0
    );

    candidate += targetAsUtc - representedAsUtc;
  }

  return new Date(candidate).toISOString();
}

function formatRegistrationDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AUCKLAND_TIME_ZONE,
  }).format(date);
}

function EmptyWinterIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <ellipse cx="120" cy="130" rx="80" ry="10" fill="#dbeafe" />

      <g transform="translate(87 44)">
        <circle cx="34" cy="58" r="29" fill="#ffffff" />
        <circle cx="34" cy="22" r="21" fill="#ffffff" />
        <circle cx="27" cy="19" r="2.5" fill="#23496c" />
        <circle cx="41" cy="19" r="2.5" fill="#23496c" />
        <path d="m34 25 11 3-11 4Z" fill="#ff9f43" />
        <path
          d="M22 34c8 6 16 6 24 0"
          fill="none"
          stroke="#55b7cf"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M18 10c4-18 27-20 35-3l-5 6H22Z" fill="#4a91df" />
      </g>

      <g stroke="#91c8e8" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M42 52v24M30 64h24M34 56l16 16M50 56 34 72" />
        <path d="M196 40v20M186 50h20M189 43l14 14M203 43l-14 14" />
        <path d="M188 105v18M179 114h18M182 108l12 12M194 108l-12 12" />
      </g>

      <path
        d="M48 122c17-19 30-25 46-29-11 15-23 25-46 29Z"
        fill="#6ee7b7"
        opacity="0.72"
      />
      <path
        d="M192 122c-17-19-30-25-46-29 11 15 23 25 46 29Z"
        fill="#93c5fd"
        opacity="0.78"
      />
    </svg>
  );
}
