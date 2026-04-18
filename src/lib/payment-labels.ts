import { PaymentKind, PaymentMethod } from "@/generated/prisma/enums";

const METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.CASH]: "Naqd",
  [PaymentMethod.CARD]: "Karta",
  [PaymentMethod.TRANSFER]: "O‘tkazma",
  [PaymentMethod.OTHER]: "Boshqa",
};

const KIND_LABELS: Record<string, string> = {
  [PaymentKind.DAILY]: "Kunlik to‘lov",
  [PaymentKind.SUBSCRIPTION]: "Abonentlik",
};

export function paymentMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method;
}

export function paymentKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}
