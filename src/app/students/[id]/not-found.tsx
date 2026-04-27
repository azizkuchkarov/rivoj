import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white/90 p-10 text-center shadow-lg">
      <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">O‘quvchi topilmadi</h1>
      <p className="mt-2 text-sm text-black">Havola noto‘g‘ri yoki yozuv o‘chirilgan bo‘lishi mumkin.</p>
      <Link
        href="/students"
        className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
      >
        Ro‘yxatga qaytish
      </Link>
    </div>
  );
}
