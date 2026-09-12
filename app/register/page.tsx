"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type Notice = { type: "success" | "error"; text: string } | null;

const interests = [
  ["guided_meditation", "Guided meditation"],
  ["mindfulness", "Mindfulness"],
  ["breath_meditation_anapanasati", "Breath meditation (Anapanasati)"],
  ["walking_meditation", "Walking meditation"],
  ["new_to_meditation", "New to meditation"],
  ["no_preference", "No preference"],
] as const;

const goals = [
  ["relax_reduce_stress", "Relax / reduce stress"],
  ["improve_focus_concentration", "Improve focus & concentration"],
  ["learn_how_to_meditate", "Learn how to meditate"],
  ["improve_general_wellbeing", "Improve general wellbeing"],
] as const;

const referralSources = [
  ["social_media", "Social media"],
  ["friend_family", "Friend / family"],
  ["poster_flyer", "Poster / flyer"],
  ["sign_outside_venue", "Sign outside our venue"],
  ["community_event", "Community event"],
  ["other", "Other"],
] as const;

export default function RegisterPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setNotice({
        type: "error",
        text: "Please choose a JPG, PNG or WebP image no larger than 5 MB.",
      });
      event.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadProfilePhoto() {
    if (!photoFile) return null;
    const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `profiles/member-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(path, photoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: photoFile.type,
      });
    if (error) throw error;
    return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setNotice(null);

    try {
      const profilePhotoUrl = await uploadProfilePhoto();
      const payload = {
        code_number: emptyToNull(data.get("code_number")),
        full_name: emptyToNull(data.get("full_name")),
        nickname: emptyToNull(data.get("nickname")),
        gender: emptyToNull(data.get("gender")),
        birth_date: emptyToNull(data.get("birth_date")),
        nationality: emptyToNull(data.get("nationality")),
        phone: emptyToNull(data.get("phone")),
        email: emptyToNull(data.get("email")),
        address: emptyToNull(data.get("address")),
        meditated_before: emptyToNull(data.get("meditated_before")),
        meditation_duration: emptyToNull(data.get("meditation_duration")),
        meditation_practice: emptyToNull(data.get("meditation_practice")),
        meditation_preferences: data.getAll("meditation_preferences").map(String),
        meditation_interest_other: emptyToNull(data.get("meditation_interest_other")),
        joining_goals: data.getAll("joining_goals").map(String),
        joining_goal_other: emptyToNull(data.get("joining_goal_other")),
        preferred_days: emptyToNull(data.get("preferred_days")),
        referral_source: emptyToNull(data.get("referral_source")),
        referral_other: emptyToNull(data.get("referral_other")),
        keep_in_touch: data.get("keep_in_touch") === "on",
        consent_agreed: data.get("consent_agreed") === "on",
        media_consent: emptyToNull(data.get("media_consent")),
        signature_name: emptyToNull(data.get("signature_name")),
        start_date: emptyToNull(data.get("start_date")),
        profile_photo_url: profilePhotoUrl,
      };

      const { data: member, error } = await supabase
        .from("members")
        .insert(payload)
        .select("id, code_number")
        .single();
      if (error) throw error;

      setNotice({
        type: "success",
        text: `Registration successful. Member ID: ${member?.code_number || "-"}`,
      });
      form.reset();
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#edf3ee] px-3 py-5 text-[#34483b] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#cdd8cf] bg-[#fffefb] shadow-[0_24px_70px_rgba(44,68,52,.14)]">
        <header className="border-b border-[#425a49] px-5 py-6 sm:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-[#b8a36a] bg-[#f8f2df] text-3xl">◉</div>
              <div>
                <p className="text-2xl font-bold tracking-[.14em] text-[#987b2c]">DIRI</p>
                <p className="text-xs text-[#796a43]">Dhammachai International Research Institute</p>
              </div>
            </div>
            <div className="sm:text-right">
              <h1 className="font-serif text-2xl font-bold uppercase tracking-wide sm:text-3xl">Dunedin Meditation Hub</h1>
              <p className="font-serif text-lg uppercase">Meditation Program Registration</p>
              <p className="text-sm text-[#69736c]">DIRI · Dhammachai International Research Institute</p>
              <p className="mt-1 font-serif italic">Take an hour to unwind, refocus and reset.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="rounded-md border border-[#b8c6ba] px-4 py-2 text-sm font-semibold hover:bg-[#edf3ee]">← Back to home</Link>
            <p className="text-xs text-[#69736c]">Fields marked Optional do not need to be completed.</p>
          </div>
          {notice && (
            <div role="status" className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${notice.type === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>
              {notice.text}
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="px-5 py-6 sm:px-10 sm:py-8">
          <Section number="1" title="Participant Details">
            <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
              <Field name="full_name" label="Full name" required />
              <Field name="nickname" label="Preferred name / nickname" />
              <Field name="birth_date" label="Date of birth" type="date" optional />
              <RadioGroup name="gender" label="Gender" optional options={[["male","Male"],["female","Female"],["prefer_not_to_say","Prefer not to say"]]} />
              <Field name="nationality" label="Nationality" optional />
              <Field name="email" label="Email" type="email" />
              <Field name="phone" label="Mobile / phone" type="tel" optional />
              <Field name="address" label="Residential address" optional hint="Kept private" />
              <Field name="code_number" label="Member ID / Code number" optional hint="Leave blank to create automatically" />
              <PhotoField preview={photoPreview} onChange={handlePhotoChange} />
            </div>
          </Section>

          <Section number="2" title="Your Meditation & Session Preferences">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <Group title="Meditation Experience">
                  <RadioGroup name="meditated_before" label="Meditated before?" options={[["yes","Yes"],["no","No"]]} />
                  <RadioGroup name="meditation_duration" label="If yes" options={[["less_than_3_months","Less than 3 months"],["3_to_12_months","3–12 months"],["1_to_3_years","1–3 years"],["more_than_3_years","More than 3 years"]]} />
                  <RadioGroup name="meditation_practice" label="Practice" options={[["regularly","Regularly"],["occasionally","Occasionally"]]} />
                </Group>
                <Group title="Your Goals" subtitle="What would you like to gain from joining? Select all that apply.">
                  <CheckList name="joining_goals" options={goals} />
                  <LineInput name="joining_goal_other" label="Other" />
                </Group>
              </div>
              <div className="space-y-6">
                <Group title="Meditation Interests">
                  <CheckList name="meditation_preferences" options={interests} columns />
                  <LineInput name="meditation_interest_other" label="Other" />
                </Group>
                <Group title="Session Preference" subtitle="Which day are you most likely to attend?">
                  <RadioGroup name="preferred_days" label="" options={[["thursday","Thursday"],["friday","Friday"],["either_day","Either day"],["varies_not_sure","Varies / Not sure"]]} />
                </Group>
                <Group title="How Did You First Hear About Us?" subtitle="Select one">
                  <RadioGroup name="referral_source" label="" options={referralSources} />
                  <LineInput name="referral_other" label="Other details" />
                </Group>
              </div>
            </div>
          </Section>

          <Section number="3" title="Communication & Participation">
            <div className="grid gap-8 lg:grid-cols-2">
              <Group title="Keeping in Touch" subtitle="We may contact you about your registration or sessions.">
                <Check name="keep_in_touch">Yes, I’d like to receive occasional updates about future sessions and events.</Check>
              </Group>
              <Group title="Participant Acknowledgement" subtitle="Please help us maintain a calm and respectful environment by being mindful of others, keeping phones on silent, and following the facilitator’s guidance. If you feel unwell or need assistance, please let a facilitator know.">
                <Check name="consent_agreed" required>I understand and agree to respect these guidelines.</Check>
              </Group>
            </div>
          </Section>

          <Section number="4" title="Photo & Media Consent">
            <p className="mb-4 text-sm leading-6">Photos or videos may be taken during sessions or events for use on Dunedin Meditation Hub’s Facebook page and promotional materials. Your choice will not affect your ability to participate. Please select one:</p>
            <RadioCards name="media_consent" required options={[["yes","YES","I consent to the use of my photo/video as described above."],["yes_no_name","YES — NO NAME","I consent, but please do not use my name or other identifying information."],["no","NO","I do not consent to being intentionally photographed or filmed."]]} />
          </Section>

          <div className="mt-7 grid items-end gap-5 md:grid-cols-[1fr_240px]">
            <Field name="signature_name" label="Participant signature / Full name" required />
            <Field name="start_date" label="Date" type="date" required />
          </div>
          <p className="mt-3 text-xs italic text-[#69736c]">I confirm that the information provided above is accurate and reflects my choices.</p>

          <button type="submit" disabled={saving} className="mt-7 w-full rounded-lg bg-[#405949] px-6 py-4 text-base font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#304438] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving registration…" : "Submit Registration"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-5 flex items-stretch border-b border-[#87978b]">
        <span className="grid min-w-28 place-items-center bg-[#405949] px-5 py-1 text-sm font-bold text-white sm:min-w-48">{number}</span>
        <h2 className="px-3 py-1 font-serif text-sm font-bold uppercase sm:text-base">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <div><h3 className="font-serif text-sm font-bold uppercase">{title}</h3>{subtitle && <p className="mb-2 text-xs italic text-[#69736c]">{subtitle}</p>}<div className="mt-2 space-y-3">{children}</div></div>;
}

function Field({ name, label, type = "text", required, optional, hint }: { name: string; label: string; type?: string; required?: boolean; optional?: boolean; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label} {optional && <small className="font-normal text-[#69736c]">(Optional)</small>} {hint && <small className="font-serif font-normal italic text-[#69736c]">— {hint}</small>}</span>
      <input name={name} type={type} required={required} className="h-11 w-full border-0 border-b border-[#aebbb0] bg-transparent px-1 text-[#27352c] outline-none transition focus:border-[#405949] focus:ring-0" />
    </label>
  );
}

function RadioGroup({ name, label, options, optional }: { name: string; label: string; options: readonly (readonly [string,string])[]; optional?: boolean }) {
  return <fieldset><legend className="mb-2 text-sm font-bold">{label} {optional && <small className="font-normal text-[#69736c]">(Optional)</small>}</legend><div className="flex flex-wrap gap-x-5 gap-y-2">{options.map(([value,text]) => <label key={value} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name={name} value={value} className="h-4 w-4 accent-[#405949]" />{text}</label>)}</div></fieldset>;
}

function CheckList({ name, options, columns }: { name: string; options: readonly (readonly [string,string])[]; columns?: boolean }) {
  return <div className={columns ? "grid gap-2 sm:grid-cols-2" : "space-y-2"}>{options.map(([value,text]) => <Check key={value} name={name} value={value}>{text}</Check>)}</div>;
}

function Check({ name, value, required, children }: { name: string; value?: string; required?: boolean; children: ReactNode }) {
  return <label className="flex cursor-pointer items-start gap-2 text-sm leading-5"><input type="checkbox" name={name} value={value} required={required} className="mt-0.5 h-4 w-4 shrink-0 accent-[#405949]" /><span>{children}</span></label>;
}

function LineInput({ name, label }: { name: string; label: string }) {
  return <label className="flex items-end gap-2 text-sm"><span>{label}:</span><input name={name} className="min-w-0 flex-1 border-0 border-b border-[#87978b] bg-transparent px-1 outline-none focus:border-[#405949] focus:ring-0" /></label>;
}

function RadioCards({ name, options, required }: { name: string; options: readonly (readonly [string,string,string])[]; required?: boolean }) {
  return <fieldset className="grid gap-3 md:grid-cols-3">{options.map(([value,title,description]) => <label key={value} className="cursor-pointer rounded-lg border border-[#cdd8cf] p-4 transition hover:bg-[#f3f5f1]"><span className="flex items-center gap-2 font-bold"><input type="radio" name={name} value={value} required={required} className="h-4 w-4 accent-[#405949]" />{title}</span><span className="mt-2 block text-xs leading-5">{description}</span></label>)}</fieldset>;
}

function PhotoField({ preview, onChange }: { preview: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">Profile photo <small className="font-normal text-[#69736c]">(Optional)</small></span><div className="flex items-center gap-3">{preview ? <img src={preview} alt="Profile preview" className="h-14 w-14 rounded-full border border-[#cdd8cf] object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full border border-[#cdd8cf] bg-[#f3f5f1] text-xl">☺</span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onChange} className="min-w-0 text-xs file:mr-3 file:rounded file:border-0 file:bg-[#405949] file:px-3 file:py-2 file:text-white" /></div></label>;
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = value === null ? "" : String(value).trim();
  return text || null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) return String(error.message);
  return "Registration failed. Please try again.";
}
