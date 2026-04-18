"use client";

import { useRouter } from "next/navigation";

type Opt = { id: string; fullName: string };

export function PaymentsStudentFilter({
  students,
  currentStudentId,
}: {
  students: Opt[];
  currentStudentId?: string;
}) {
  const router = useRouter();

  return (
    <select
      id="filter-student"
      value={currentStudentId ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v ? `/payments?studentId=${encodeURIComponent(v)}` : "/payments");
      }}
      className="min-w-[220px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-sm"
    >
      <option value="">Barcha o‘quvchilar</option>
      {students.map((s) => (
        <option key={s.id} value={s.id}>
          {s.fullName}
        </option>
      ))}
    </select>
  );
}
