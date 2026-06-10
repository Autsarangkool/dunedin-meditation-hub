import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function QRCheckinPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (!member) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-md text-center">
        <h1 className="text-3xl font-bold text-[#4b5f4a]">
          QR Check-in
        </h1>

        <p className="mt-3 text-gray-600">
          สมาชิก
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {member.full_name}
        </h2>

        <p className="text-gray-500">
          {member.nickname || "-"}
        </p>

        <div className="mt-6">
          <a
            href={`/checkin?member=${member.id}`}
            className="block rounded-xl bg-green-700 px-6 py-4 text-lg font-semibold text-white"
          >
            เช็คอินสมาชิกคนนี้
          </a>
        </div>
      </div>
    </main>
  );
}