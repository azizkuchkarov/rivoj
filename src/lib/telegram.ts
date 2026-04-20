type TelegramSendResult = { ok: true } | { ok: false; reason: string };

function normalizePhone(raw: string): string {
  return raw.replace(/\D+/g, "");
}

function getBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
}

function getChatIdByPhone(phone: string): string | null {
  const raw = process.env.TELEGRAM_CHAT_IDS_BY_PHONE?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const normalizedNeedle = normalizePhone(phone);
    for (const [k, v] of Object.entries(parsed)) {
      if (normalizePhone(k) === normalizedNeedle) {
        const chatId = String(v ?? "").trim();
        return chatId || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function sendTelegramText(chatId: string, text: string): Promise<TelegramSendResult> {
  const token = getBotToken();
  if (!token) return { ok: false, reason: "TELEGRAM_BOT_TOKEN yo‘q" };
  if (!chatId.trim()) return { ok: false, reason: "chat_id yo‘q" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, reason: `Telegram API ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "so‘rov xatosi" };
  }
}

export async function sendTelegramTextByPhone(phone: string | null | undefined, text: string): Promise<TelegramSendResult> {
  if (!phone?.trim()) return { ok: false, reason: "Telefon yo‘q" };
  const chatId = getChatIdByPhone(phone);
  if (!chatId) return { ok: false, reason: "Bu telefon uchun chat_id topilmadi" };
  return sendTelegramText(chatId, text);
}

