"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { studentColumns, type StudentRow } from "@/components/students/students-columns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function StudentsDataTable({ data }: { data: StudentRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "fullName", desc: false }]);
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? data.filter((s) => s.fullName.toLowerCase().includes(q.trim().toLowerCase()))
    : data;

  const table = useReactTable({
    data: filtered,
    columns: studentColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Ism bo‘yicha qidirish…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          {filtered.length} ta {q.trim() ? "(filtrlangan)" : ""}
        </p>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={studentColumns.length} className="h-24 text-center text-muted-foreground">
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
