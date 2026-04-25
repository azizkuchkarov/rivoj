"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { teacherColumns, type TeacherRow } from "@/components/teachers/teachers-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export function TeachersDataTable({ data }: { data: TeacherRow[] }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? data.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q.trim().toLowerCase()) ||
          String(t.listNumber).includes(q.trim()),
      )
    : data;

  const table = useReactTable({
    data: filtered,
    columns: teacherColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Ism yoki tartib raqami bo‘yicha qidirish…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">{filtered.length} ta</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted hover:bg-muted">
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={teacherColumns.length} className="h-24 text-center text-muted-foreground">
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
