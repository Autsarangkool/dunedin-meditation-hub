import { supabase } from "@/lib/supabase";
import PdfDownloadButton from "./PdfDownloadButton";

export default async function MembersPdfPage() {
  const { data: members } = await supabase
    .from("members")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <main className="min-h-screen bg-white p-8 text-black">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href="/members" className="rounded-lg bg-gray-700 px-4 py-2 text-white">
          ← กลับหน้ารายชื่อ
        </a>

       <PdfDownloadButton members={members || []} />
      </div>

      <h1 className="text-3xl font-bold">รายชื่อสมาชิก / Members List</h1>

      <p className="mt-2 text-gray-600">
        สมาชิกทั้งหมด / Total Members: {members?.length || 0}
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">ลำดับ</th>
            <th className="border p-2 text-left">ชื่อ / Name</th>
            <th className="border p-2 text-left">ชื่อเล่น</th>
            <th className="border p-2 text-left">โทร</th>
            <th className="border p-2 text-left">อีเมล</th>
          </tr>
        </thead>

        <tbody>
          {(members || []).map((member, index) => (
            <tr key={member.id}>
              <td className="border p-2">{index + 1}</td>
              <td className="border p-2">{member.full_name || "-"}</td>
              <td className="border p-2">{member.nickname || "-"}</td>
              <td className="border p-2">{member.phone || "-"}</td>
              <td className="border p-2">{member.email || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}