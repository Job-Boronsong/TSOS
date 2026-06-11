import { useLiveQuery } from "dexie-react-hooks";
import { localDb, type LocalStudent, type LocalClass, type LocalTeacher, type LocalAttendance, type LocalPayment, type LocalSale, type LocalExpenditure, type LocalFeeSettings } from "./local-db";
import { enqueueOperation } from "./sync-service";
import { useCallback } from "react";

function tempId(): number {
  return -(Date.now() + Math.floor(Math.random() * 10000));
}

function nowIso(): string {
  return new Date().toISOString();
}

export function useLocalStudents(schoolId: number | null): LocalStudent[] {
  const result = useLiveQuery<LocalStudent[]>(
    () => schoolId ? localDb.students.where("schoolId").equals(schoolId).toArray() : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalClasses(schoolId: number | null): LocalClass[] {
  const result = useLiveQuery<LocalClass[]>(
    () => schoolId ? localDb.classes.where("schoolId").equals(schoolId).toArray() : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalTeachers(schoolId: number | null): LocalTeacher[] {
  const result = useLiveQuery<LocalTeacher[]>(
    () => schoolId ? localDb.teachers.where("schoolId").equals(schoolId).toArray() : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalAttendance(schoolId: number | null, date: string | null): LocalAttendance[] {
  const result = useLiveQuery<LocalAttendance[]>(
    () => schoolId && date
      ? localDb.attendance.where("[schoolId+date]").equals([schoolId, date]).toArray()
      : Promise.resolve([]),
    [schoolId, date]
  );
  return result ?? [];
}

export function useLocalPayments(schoolId: number | null): LocalPayment[] {
  const result = useLiveQuery<LocalPayment[]>(
    () => schoolId
      ? localDb.payments.where("schoolId").equals(schoolId).sortBy("paymentDate").then(arr => [...arr].reverse())
      : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalSales(schoolId: number | null): LocalSale[] {
  const result = useLiveQuery<LocalSale[]>(
    () => schoolId
      ? localDb.sales.where("schoolId").equals(schoolId).sortBy("saleDate").then(arr => [...arr].reverse())
      : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalExpenditures(schoolId: number | null): LocalExpenditure[] {
  const result = useLiveQuery<LocalExpenditure[]>(
    () => schoolId
      ? localDb.expenditures.where("schoolId").equals(schoolId).sortBy("expenditureDate").then(arr => [...arr].reverse())
      : Promise.resolve([]),
    [schoolId]
  );
  return result ?? [];
}

export function useLocalFeeSettings(schoolId: number | null): LocalFeeSettings | undefined {
  return useLiveQuery<LocalFeeSettings | undefined>(
    () => schoolId ? localDb.feeSettings.where("schoolId").equals(schoolId).first() : Promise.resolve(undefined),
    [schoolId]
  );
}

export function useLocalFeatureToggles(schoolId: number | null) {
  return useLiveQuery(
    () => schoolId ? localDb.featureToggles.where("schoolId").equals(schoolId).first() : Promise.resolve(undefined),
    [schoolId]
  );
}

export function useCreateStudentOffline(schoolId: number) {
  return useCallback(async (data: Omit<LocalStudent, "id" | "schoolId" | "createdAt" | "updatedAt" | "_localOnly" | "_localId">) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const student: LocalStudent = { ...data, id, schoolId, createdAt: now, updatedAt: now, _localOnly: true, _localId };
    await localDb.students.put(student);
    await enqueueOperation({ opId: _localId, entity: "student", action: "create", data: { ...data, schoolId, _localId } });
    return student;
  }, [schoolId]);
}

export function useUpdateStudentOffline(schoolId: number) {
  return useCallback(async (id: number, data: Partial<LocalStudent>) => {
    await localDb.students.update(id, { ...data, updatedAt: nowIso() });
    await enqueueOperation({ opId: `upd_student_${id}_${Date.now()}`, entity: "student", action: "update", data, serverId: id });
  }, [schoolId]);
}

export function useDeleteStudentOffline(schoolId: number) {
  return useCallback(async (id: number) => {
    await localDb.students.delete(id);
    await enqueueOperation({ opId: `del_student_${id}_${Date.now()}`, entity: "student", action: "delete", data: {}, serverId: id });
  }, [schoolId]);
}

export function useCreateClassOffline(schoolId: number) {
  return useCallback(async (data: { name: string; grade?: string; level?: string; teacherId?: number; useSubjectTeachers?: boolean }) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const cls: LocalClass = { ...data, id, schoolId, createdAt: now, _localOnly: true, _localId, grade: data.grade ?? null, level: data.level ?? "primary", teacherId: data.teacherId ?? null, useSubjectTeachers: data.useSubjectTeachers ?? false };
    await localDb.classes.put(cls);
    await enqueueOperation({ opId: _localId, entity: "class", action: "create", data: { ...data, schoolId, _localId } });
    return cls;
  }, [schoolId]);
}

export function useDeleteClassOffline(schoolId: number) {
  return useCallback(async (id: number) => {
    await localDb.classes.delete(id);
    await enqueueOperation({ opId: `del_class_${id}_${Date.now()}`, entity: "class", action: "delete", data: {}, serverId: id });
  }, [schoolId]);
}

export function useCreateTeacherOffline(schoolId: number) {
  return useCallback(async (data: { name: string; subject?: string; phone?: string; email?: string }) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const teacher: LocalTeacher = { ...data, id, schoolId, status: "active", createdAt: now, _localOnly: true, _localId, subject: data.subject ?? null, phone: data.phone ?? null, email: data.email ?? null };
    await localDb.teachers.put(teacher);
    await enqueueOperation({ opId: _localId, entity: "teacher", action: "create", data: { ...data, schoolId, _localId } });
    return teacher;
  }, [schoolId]);
}

export function useUpdateTeacherOffline(schoolId: number) {
  return useCallback(async (id: number, data: Partial<LocalTeacher>) => {
    await localDb.teachers.update(id, data);
    await enqueueOperation({ opId: `upd_teacher_${id}_${Date.now()}`, entity: "teacher", action: "update", data, serverId: id });
  }, [schoolId]);
}

export function useDeleteTeacherOffline(schoolId: number) {
  return useCallback(async (id: number) => {
    await localDb.teachers.delete(id);
    await enqueueOperation({ opId: `del_teacher_${id}_${Date.now()}`, entity: "teacher", action: "delete", data: {}, serverId: id });
  }, [schoolId]);
}

export function useMarkAttendanceOffline(schoolId: number) {
  return useCallback(async (date: string, records: { studentId: number; status: string }[]) => {
    const now = nowIso();
    for (const rec of records) {
      const existing = await localDb.attendance.where("[schoolId+studentId+date]").equals([schoolId, rec.studentId, date]).first();
      if (existing) {
        await localDb.attendance.update(existing.id, { status: rec.status, updatedAt: now });
      } else {
        const id = tempId();
        await localDb.attendance.put({ id, schoolId, studentId: rec.studentId, date, status: rec.status, markedViaPayment: false, overridden: false, notes: null, createdAt: now, updatedAt: now });
      }
    }
    await enqueueOperation({ opId: `att_${date}_${Date.now()}`, entity: "attendance", action: "mark", data: { date, records } });
  }, [schoolId]);
}

export function useCreatePaymentOffline(schoolId: number) {
  return useCallback(async (data: { studentId: number; amount: number; paymentDate: string; paymentType: string; notes?: string; term?: string | null; academicYear?: string | null }) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const payment: LocalPayment = { id, schoolId, createdAt: now, _localOnly: true, _localId, notes: data.notes ?? null, term: data.term ?? null, academicYear: data.academicYear ?? null, ...data };
    await localDb.payments.put(payment);
    await enqueueOperation({ opId: _localId, entity: "payment", action: "create", data: { ...data, schoolId, _localId } });
    return payment;
  }, [schoolId]);
}

export function useCreateSaleOffline(schoolId: number) {
  return useCallback(async (data: { description: string; amount: number; saleDate: string; category?: string }) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const sale: LocalSale = { id, schoolId, createdAt: now, _localOnly: true, _localId, category: data.category ?? null, ...data };
    await localDb.sales.put(sale);
    await enqueueOperation({ opId: _localId, entity: "sale", action: "create", data: { ...data, schoolId, _localId } });
    return sale;
  }, [schoolId]);
}

export function useCreateExpenditureOffline(schoolId: number) {
  return useCallback(async (data: { description: string; amount: number; expenditureDate: string; category?: string }) => {
    const _localId = String(tempId());
    const id = Number(_localId);
    const now = nowIso();
    const exp: LocalExpenditure = { id, schoolId, createdAt: now, _localOnly: true, _localId, category: data.category ?? null, ...data };
    await localDb.expenditures.put(exp);
    await enqueueOperation({ opId: _localId, entity: "expenditure", action: "create", data: { ...data, schoolId, _localId } });
    return exp;
  }, [schoolId]);
}
