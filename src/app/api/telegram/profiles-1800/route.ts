import { NextResponse } from "next/server";

import { sendManager1800Report } from "@/lib/telegram-profiles";

export async function GET() {
  const result = await sendManager1800Report();
  return NextResponse.json({
    ok: result.ok,
    ...(result.ok ? {} : { reason: result.reason }),
  });
}
