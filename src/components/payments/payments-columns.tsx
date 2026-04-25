"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { deletePayment } from "@/app/payments/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { buttonVariants } from "@/components/ui/button";
import { formatSomUZS } from "@/lib/format-currency";
import { paymentKindLabel, paymentMethodLabel } from "@/lib/payment-labels";
import { cn } from "@/lib/utils";

export type PaymentRow = {
  id: string;
  paidAt: Date;
  amountSom: number;
  kind: string;
  method: string;
  description: string | null;
  student: { id: string; fullName: string };
  teacher: { id: string; fullName: string } | null;
  shareDetail: string;
};

function paidLabel(d: Date) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const paymentColumns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: "paidAt",
    header: "Sana",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">{paidLabel(row.original.paidAt)}</span>
    ),
  },
  {
    accessorKey: "student",
    header: "O‘quvchi",
    cell: ({ row }) => (
      <Link
        href={`/students/${row.original.student.id}`}
        className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 font-medium")}
      >
        {row.original.student.fullName}
      </Link>
    ),
  },
  {
    accessorKey: "kind",
    header: "Tur",
    cell: ({ row }) => paymentKindLabel(row.original.kind),
  },
  {
    accessorKey: "amountSom",
    header: "Summa",
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">{formatSomUZS(row.original.amountSom)} so‘m</span>
    ),
  },
  {
    accessorKey: "teacher",
    header: "O‘qituvchi",
    cell: ({ row }) =>
      row.original.teacher ? (
        <Link
          href={`/teachers/${row.original.teacher.id}`}
          className={cn(buttonVariants({ variant: "link" }), "h-auto max-w-[140px] truncate p-0")}
          title={row.original.teacher.fullName}
        >
          {row.original.teacher.fullName}
        </Link>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "shareDetail",
    header: "O‘q. ulushi",
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate text-xs text-muted-foreground" title={row.original.shareDetail}>
        {row.original.shareDetail}
      </span>
    ),
  },
  {
    accessorKey: "method",
    header: "Usul",
    cell: ({ row }) => paymentMethodLabel(row.original.method),
  },
  {
    accessorKey: "description",
    header: "Maqsad",
    cell: ({ row }) => (
      <span className="max-w-[220px] truncate text-muted-foreground" title={row.original.description ?? ""}>
        {row.original.description ?? "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DeleteConfirmForm
        action={deletePayment}
        id={row.original.id}
        displayName={`${formatSomUZS(row.original.amountSom)} so‘m · ${row.original.student.fullName}`}
        entityLabel="To‘lovni"
        compact
      />
    ),
  },
];
