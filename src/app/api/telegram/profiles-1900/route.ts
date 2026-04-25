import { NextResponse } from "next/server";

import { sendManagerAndAdmin1900Report } from "@/lib/telegram-profiles";

export async function GET() {
  const result = await sendManagerAndAdmin1900Report();
  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    date: result.dateIso,
  });
}
