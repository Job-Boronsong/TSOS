import Dexie, { type Table } from "dexie";

export interface LocalStudent {
  id: number;
  schoolId: number;
  name: string;
  studentNumber: string;
  classId: number | null;
  category: string;
  gender: string | null;
  dateOfBirth: string | null;
  parentName: string | null;
  parentPhone: string | null;
  status: string;
  photoUrl: string | null;
  feeWaiver?: boolean;
  feedingWaiver?: boolean;
  busWaiver?: boolean;
  createdAt: string;
  updatedAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalClass {
  id: number;
  schoolId: number;
  name: string;
  grade: string | null;
  level: string; // 'nursery' | 'kg' | 'primary' | 'jhs'
  teacherId: number | null;
  createdAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalTeacher {
  id: number;
  schoolId: number;
  name: string;
  subject: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalAttendance {
  id: number;
  schoolId: number;
  studentId: number;
  date: string;
  status: string;
  markedViaPayment: boolean;
  overridden: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalPayment {
  id: number;
  schoolId: number;
  studentId: number;
  amount: number;
  paymentDate: string;
  paymentType: string;
  notes: string | null;
  term?: string | null;
  academicYear?: string | null;
  createdAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalSale {
  id: number;
  schoolId: number;
  description: string;
  amount: number;
  saleDate: string;
  category: string | null;
  createdAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalExpenditure {
  id: number;
  schoolId: number;
  description: string;
  amount: number;
  expenditureDate: string;
  category: string | null;
  createdAt: string;
  _localOnly?: boolean;
  _localId?: string;
}

export interface LocalFeeSettings {
  id: number;
  schoolId: number;
  schoolFee: string;
  busFee: string;
  scholarshipDiscount: string;
  staffChildDiscount: string;
  termBillingEnabled: string;
  feedingFeePerDay?: string;
  feedingEnabled?: string;
  busFeePerDay?: string;
  scholarshipWaivedFees?: string;
  staffChildWaivedFees?: string;
  term1SchoolFee?: string | null;
  term2SchoolFee?: string | null;
  term3SchoolFee?: string | null;
  updatedAt: string;
}

export interface LocalFeatureToggles {
  id: number;
  schoolId: number;
  attendanceEnabled: boolean;
  financeEnabled: boolean;
  salesEnabled: boolean;
  reportsEnabled: boolean;
  busEnabled: boolean;
  updatedAt: string;
}

export interface LocalSchoolSettings {
  id: number;
  schoolId: number;
  themeColor: string | null;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  opId: string;
  entity: string;
  action: string;
  data: any;
  serverId?: number;
  createdAt: number;
  retries: number;
}

export interface SyncMeta {
  key: string;
  value: string;
}

class EduManageDB extends Dexie {
  students!: Table<LocalStudent>;
  classes!: Table<LocalClass>;
  teachers!: Table<LocalTeacher>;
  attendance!: Table<LocalAttendance>;
  payments!: Table<LocalPayment>;
  sales!: Table<LocalSale>;
  expenditures!: Table<LocalExpenditure>;
  feeSettings!: Table<LocalFeeSettings>;
  featureToggles!: Table<LocalFeatureToggles>;
  schoolSettings!: Table<LocalSchoolSettings>;
  syncQueue!: Table<SyncQueueItem>;
  syncMeta!: Table<SyncMeta>;

  constructor() {
    super("edumanage");
    this.version(1).stores({
      students: "id, schoolId, classId, status, studentNumber",
      classes: "id, schoolId",
      teachers: "id, schoolId, status",
      attendance: "id, schoolId, studentId, date, [schoolId+date], [schoolId+studentId+date]",
      payments: "id, schoolId, studentId, paymentDate",
      sales: "id, schoolId, saleDate",
      expenditures: "id, schoolId, expenditureDate",
      feeSettings: "id, schoolId",
      featureToggles: "id, schoolId",
      schoolSettings: "id, schoolId",
      syncQueue: "++id, opId, entity, createdAt, retries",
      syncMeta: "key",
    });
    // Version 2: add level field to classes (no store structure change needed)
    this.version(2).stores({
      students: "id, schoolId, classId, status, studentNumber",
      classes: "id, schoolId, level",
      teachers: "id, schoolId, status",
      attendance: "id, schoolId, studentId, date, [schoolId+date], [schoolId+studentId+date]",
      payments: "id, schoolId, studentId, paymentDate",
      sales: "id, schoolId, saleDate",
      expenditures: "id, schoolId, expenditureDate",
      feeSettings: "id, schoolId",
      featureToggles: "id, schoolId",
      schoolSettings: "id, schoolId",
      syncQueue: "++id, opId, entity, createdAt, retries",
      syncMeta: "key",
    });
  }
}

export const localDb = new EduManageDB();

export async function getLastSyncedAt(schoolId: number): Promise<Date | null> {
  const meta = await localDb.syncMeta.get(`lastSyncedAt_${schoolId}`);
  return meta ? new Date(meta.value) : null;
}

export async function setLastSyncedAt(schoolId: number, date: Date): Promise<void> {
  await localDb.syncMeta.put({ key: `lastSyncedAt_${schoolId}`, value: date.toISOString() });
}

export async function hasLocalData(schoolId: number): Promise<boolean> {
  // If sync has ever completed for this school, consider local data present
  // (even if the school has no students/classes yet)
  const meta = await localDb.syncMeta.get(`lastSyncedAt_${schoolId}`);
  if (meta?.value) return true;
  // Fallback: check for any local records
  const count = await localDb.students.where("schoolId").equals(schoolId).count();
  const classCount = await localDb.classes.where("schoolId").equals(schoolId).count();
  return count > 0 || classCount > 0;
}
