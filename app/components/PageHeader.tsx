import Link from "next/link";

export default function PageHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>

      <Link
        href="/"
        className="rounded-xl bg-teal-600 px-4 py-2 text-white"
      >
        🏠 Home
      </Link>
    </div>
  );
}