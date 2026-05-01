"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import type { StudentActionState } from "@/app/students/actions";
import type { Student, Teacher } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { STUDENT_GROUP_OPTIONS, type StudentGroupValue } from "@/lib/student-group";
import { STUDENT_SOURCE_OPTIONS, type StudentSourceValue } from "@/lib/student-source";
import { studentFormSchema } from "@/lib/validations/student";
import { STUDENT_GENDER_OPTIONS } from "@/lib/student-gender";

type StudentFormProps = {
  action: (state: StudentActionState, formData: FormData) => Promise<StudentActionState>;
  teachers: Pick<Teacher, "id" | "fullName" | "isActive" | "listNumber">[];
  defaultValues?: Partial<
    Pick<
      Student,
      | "fullName"
      | "group"
      | "source"
      | "dateOfBirth"
      | "gender"
      | "guardianName"
      | "guardianPhone"
      | "telegramChatId"
      | "notes"
      | "focusAreas"
      | "primaryTeacherId"
      | "isActive"
    >
  >;
  submitLabel: string;
};

type FormInput = {
  fullName: string;
  group: StudentGroupValue;
  source: StudentSourceValue;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  telegramChatId: string;
  notes: string;
  focusAreas: string;
  primaryTeacherId: string;
  isActive: "true" | "false";
};

function formatDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function isLegacyGender(g: string | null | undefined) {
  if (!g) return false;
  return g !== "male" && g !== "female";
}

export function StudentForm({ action, teachers, defaultValues, submitLabel }: StudentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const dv = defaultValues ?? {};
  const focusText = Array.isArray(dv.focusAreas) ? dv.focusAreas.join(", ") : "";
  const legacyGender = typeof dv.gender === "string" && isLegacyGender(dv.gender) ? dv.gender : null;

  const form = useForm<FormInput>({
    defaultValues: {
      fullName: dv.fullName ?? "",
      group:
        STUDENT_GROUP_OPTIONS.find((groupOption) => groupOption.value === dv.group)?.value ??
        STUDENT_GROUP_OPTIONS[0]!.value,
      source:
        STUDENT_SOURCE_OPTIONS.find((sourceOption) => sourceOption.value === dv.source)?.value ??
        STUDENT_SOURCE_OPTIONS[0]!.value,
      dateOfBirth: formatDateInput(dv.dateOfBirth),
      gender: legacyGender
        ? legacyGender
        : dv.gender === "male" || dv.gender === "female"
          ? dv.gender
          : "",
      guardianName: dv.guardianName ?? "",
      guardianPhone: dv.guardianPhone ?? "",
      telegramChatId: dv.telegramChatId ?? "",
      notes: dv.notes ?? "",
      focusAreas: focusText,
      primaryTeacherId: dv.primaryTeacherId ?? "",
      isActive: dv.isActive !== false ? "true" : "false",
    },
  });

  const { control, register, setError, formState } = form;

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [key, message] of Object.entries(state.fieldErrors)) {
      setError(key as keyof FormInput, { type: "server", message });
    }
  }, [state.fieldErrors, setError]);

  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        const values = form.getValues();
        const parsed = studentFormSchema.safeParse(values);
        if (!parsed.success) {
          e.preventDefault();
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (typeof key === "string") {
              setError(key as keyof FormInput, { type: "schema", message: issue.message });
            }
          }
        }
      }}
    >
      {state.error ? (
        <Card className="border-destructive bg-destructive">
          <CardContent className="py-3 text-sm text-destructive" role="alert">
            {state.error}
          </CardContent>
        </Card>
      ) : null}

      <FieldSet>
        <FieldGroup className="gap-6 md:grid md:grid-cols-2">
          <Field className="md:col-span-2">
            <FieldLabel htmlFor="fullName">
              Bola ismi <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input id="fullName" autoComplete="name" placeholder="Masalan: Amir Karimov" {...register("fullName")} />
              <FieldError errors={[formState.errors.fullName]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="group">
              Guruh <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <select
                id="group"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("group")}
              >
                {STUDENT_GROUP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldError errors={[formState.errors.group]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="dateOfBirth">Tug‘ilgan sana</FieldLabel>
            <FieldContent>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              <FieldError errors={[formState.errors.dateOfBirth]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="source">
              Qayerdan keldi <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <select
                id="source"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("source")}
              >
                {STUDENT_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FieldError errors={[formState.errors.source]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="gender">Jins</FieldLabel>
            <FieldContent>
              <select
                id="gender"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("gender")}
              >
                {STUDENT_GENDER_OPTIONS.map((o) => (
                  <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {legacyGender ? (
                  <option value={legacyGender}>{legacyGender} (avvalgi yozuv)</option>
                ) : null}
              </select>
              <FieldError errors={[formState.errors.gender]} />
            </FieldContent>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="primaryTeacherId">Asosiy o‘qituvchi</FieldLabel>
            <FieldContent>
              <select
                id="primaryTeacherId"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("primaryTeacherId")}
              >
                <option value="">Tanlanmagan</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    №{t.listNumber} — {t.fullName}
                    {!t.isActive ? " (nofaol)" : ""}
                  </option>
                ))}
              </select>
              <FieldDescription>Keyinroq avtomatik taqsimot uchun ham ishlatiladi.</FieldDescription>
              <FieldError errors={[formState.errors.primaryTeacherId]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="guardianName">Ota-ona / vasiy</FieldLabel>
            <FieldContent>
              <Input id="guardianName" placeholder="F.I.O." {...register("guardianName")} />
              <FieldError errors={[formState.errors.guardianName]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="guardianPhone">Vasiy telefoni</FieldLabel>
            <FieldContent>
              <Input id="guardianPhone" placeholder="+998 …" autoComplete="tel" {...register("guardianPhone")} />
              <FieldError errors={[formState.errors.guardianPhone]} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="telegramChatId">Telegram chat ID</FieldLabel>
            <FieldContent>
              <Input id="telegramChatId" placeholder="123456789" {...register("telegramChatId")} />
              <FieldDescription>O‘quvchi (yoki ota-ona) botga /start berganidan keyin chiqqan ID.</FieldDescription>
              <FieldError errors={[formState.errors.telegramChatId]} />
            </FieldContent>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="focusAreas">Mashg‘ulot / ehtiyoj yo‘nalishlari</FieldLabel>
            <FieldContent>
              <Textarea
                id="focusAreas"
                rows={3}
                placeholder="Artikulyatsiya, nutq… — vergul bilan ajrating"
                {...register("focusAreas")}
              />
              <FieldError errors={[formState.errors.focusAreas]} />
            </FieldContent>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="notes">Izoh</FieldLabel>
            <FieldContent>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Qisqa eslatmalar, tibbiy cheklovlar (maxfiy saqlanadi)…"
                {...register("notes")}
              />
              <FieldError errors={[formState.errors.notes]} />
            </FieldContent>
          </Field>

          <Field orientation="horizontal" className="md:col-span-2 rounded-lg border border-border bg-muted p-3">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <>
                  <Checkbox
                    checked={field.value === "true"}
                    onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
                  />
                  <input type="hidden" name="isActive" value={field.value} />
                  <FieldContent>
                    <FieldLabel htmlFor="isActive-hint" className="cursor-pointer font-medium">
                      O‘quvchi faol (jadval va qabulda ko‘rinadi)
                    </FieldLabel>
                  </FieldContent>
                </>
              )}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" disabled={pending} size="lg" className="min-w-[160px] gap-2">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
