"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useState } from "react";

import { paymentColumns, type PaymentRow } from "@/components/payments/payments-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PaymentsDataTable({ data }: { data: PaymentRow[] }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? data.filter(
        (p) =>
          p.student.fullName.toLowerCase().includes(q.trim().toLowerCase()) ||
          (p.teacher?.fullName.toLowerCase().includes(q.trim().toLowerCase()) ?? false),
      )
    : data;

  const table = useReactTable({
    data: filtered,
    columns: paymentColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="O‘quvchi yoki o‘qituvchi bo‘yicha qidirish…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">{filtered.length} ta yozuv</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={paymentColumns.length} className="h-24 text-center text-muted-foreground">
                  Natija yo‘q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
