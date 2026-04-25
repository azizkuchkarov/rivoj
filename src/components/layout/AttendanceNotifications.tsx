"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Bell, Clock3, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  kind: "LESSON" | "CONSULTATION";
  isSubscription: boolean;
  lessonDateIso: string;
  title: string;
  timeRange: string;
  teacherId: string;
  teacherName: string;
  studentName: string;
  isOverdue: boolean;
  href: string;
};

type QuickActionPayload = {
  attendance: "PRESENT" | "ABSENT";
  guardianFee?: "PAID" | "UNPAID" | "NA";
};

type PendingAttendanceResponse = {
  ok: boolean;
  nowDateIso: string;
  count: number;
  items: NotificationItem[];
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function AttendanceNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PendingAttendanceResponse | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [markingById, setMarkingById] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("attendance_notification_dismissed_ids");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setDismissedIds(parsed.filter((x): x is string => typeof x === "string"));
      }
    } catch {
      // ignore invalid localStorage value
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("attendance_notification_dismissed_ids", JSON.stringify(dismissedIds));
    } catch {
      // ignore write errors
    }
  }, [dismissedIds]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications/attendance-pending", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as PendingAttendanceResponse;
      setData(json);
    } catch {
      setError("Xabarlarni yuklab bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const visibleItems = useMemo(() => {
    if (!data?.items) return [];
    if (dismissedIds.length === 0) return data.items;
    const hidden = new Set(dismissedIds);
    return data.items.filter((x) => !hidden.has(x.id));
  }, [data?.items, dismissedIds]);

  const markFromNotification = useCallback(
    async (item: NotificationItem, payload: QuickActionPayload, pendingKey: string) => {
      setMarkingById((prev) => ({ ...prev, [item.id]: pendingKey }));
      try {
        const res = await fetch("/api/notifications/attendance-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: item.id,
            attendance: payload.attendance,
            guardianFee: payload.guardianFee ?? "NA",
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string; rescheduleUrl?: string };
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Saqlab bo‘lmadi");
        }
        setData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((x) => x.id !== item.id),
                count: Math.max(0, prev.count - 1),
              }
            : prev,
        );
        if (payload.attendance === "ABSENT" && json.rescheduleUrl) {
          setOpen(false);
          router.push(json.rescheduleUrl);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Saqlashda xatolik");
      } finally {
        setMarkingById((prev) => ({ ...prev, [item.id]: undefined }));
      }
    },
    [router],
  );

  const count = visibleItems.length;
  const overdueCount = useMemo(
    () => visibleItems.filter((x) => x.isOverdue).length,
    [visibleItems],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Уведомления" className="relative">
            <Bell className="size-4" aria-hidden />
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Button>
        }
      />
      <SheetContent side="right" className="w-[400px] p-0 sm:max-w-[420px]">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="size-4" aria-hidden />
            Уведомления
          </SheetTitle>
          <p className="text-xs text-black">
            Darsi tugagan va hali belgilash kiritilmagan darslar.
          </p>
        </SheetHeader>

        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-black">
          <span>Jami: {count} ta</span>
          {overdueCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">
              <TriangleAlert className="size-3.5" aria-hidden />
              Kechikkan: {overdueCount}
            </span>
          ) : null}
        </div>

        <ScrollArea className="h-[calc(100vh-8.5rem)]">
          <div className="space-y-2 p-3">
            {loading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm text-black">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Yuklanmoqda...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-black">
                Hozircha yangi xabar yo‘q.
              </div>
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border bg-white p-3",
                    item.isOverdue ? "border-amber-300" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-black">{item.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          item.kind === "CONSULTATION"
                            ? "bg-violet-100 text-violet-900"
                            : "bg-indigo-100 text-indigo-900",
                        )}
                      >
                        {item.kind === "CONSULTATION" ? "Konsultatsiya" : "Dars"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDismissedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]))}
                        className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Yopish
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-black">
                    <Clock3 className="size-3.5" aria-hidden />
                    <span>{formatDate(item.lessonDateIso)} · {item.timeRange}</span>
                  </div>
                  {item.isSubscription ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(markingById[item.id])}
                        onClick={() =>
                          void markFromNotification(item, { attendance: "PRESENT", guardianFee: "NA" }, "sub-present")
                        }
                        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {markingById[item.id] === "sub-present" ? "Saqlanmoqda..." : "Darsga keldi"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(markingById[item.id])}
                        onClick={() =>
                          void markFromNotification(item, { attendance: "ABSENT", guardianFee: "NA" }, "sub-absent")
                        }
                        className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-60"
                      >
                        {markingById[item.id] === "sub-absent" ? "Saqlanmoqda..." : "Darsga kelmadi"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(markingById[item.id])}
                        onClick={() =>
                          void markFromNotification(
                            item,
                            { attendance: "PRESENT", guardianFee: "PAID" },
                            "daily-present-paid",
                          )
                        }
                        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {markingById[item.id] === "daily-present-paid" ? "Saqlanmoqda..." : "Keldi · To‘landi"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(markingById[item.id])}
                        onClick={() =>
                          void markFromNotification(
                            item,
                            { attendance: "PRESENT", guardianFee: "UNPAID" },
                            "daily-present-unpaid",
                          )
                        }
                        className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                      >
                        {markingById[item.id] === "daily-present-unpaid" ? "Saqlanmoqda..." : "Keldi · To‘lanmadi"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(markingById[item.id])}
                        onClick={() =>
                          void markFromNotification(item, { attendance: "ABSENT", guardianFee: "NA" }, "daily-absent")
                        }
                        className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-60"
                      >
                        {markingById[item.id] === "daily-absent" ? "Saqlanmoqda..." : "Darsga kelmadi"}
                      </button>
                    </div>
                  )}
                  <div className="mt-2">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      Jadvalni ochish
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

