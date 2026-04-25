"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Avatar } from "@/components/teachers/Avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TeacherRow = {
  id: string;
  listNumber: number;
  fullName: string;
  isActive: boolean;
  studentCount: number;
  lessonCount: number;
};

export const teacherColumns: ColumnDef<TeacherRow>[] = [
  {
    accessorKey: "listNumber",
    header: "№",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">№{row.original.listNumber}</span>
    ),
  },
  {
    accessorKey: "fullName",
    header: "O‘qituvchi",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.fullName} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.studentCount} o‘quvchi · {row.original.lessonCount} dars
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Holat",
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/20">
          Faol
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Nofaol
        </Badge>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        href={`/teachers/${row.original.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}
      >
        Profil
      </Link>
    ),
  },
];
