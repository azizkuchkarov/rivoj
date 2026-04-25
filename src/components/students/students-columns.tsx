"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Avatar } from "@/components/teachers/Avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudentRow = {
  id: string;
  fullName: string;
  isActive: boolean;
  primaryTeacherName: string | null;
};

export const studentColumns: ColumnDef<StudentRow>[] = [
  {
    accessorKey: "fullName",
    header: "O‘quvchi",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.fullName} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.fullName}</p>
          {row.original.primaryTeacherName ? (
            <p className="truncate text-xs text-muted-foreground">{row.original.primaryTeacherName}</p>
          ) : null}
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
        href={`/students/${row.original.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-primary")}
      >
        Profil
      </Link>
    ),
  },
];
