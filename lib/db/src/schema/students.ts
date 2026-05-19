import { pgTable, text, serial, timestamp, integer, date, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  name: text("name").notNull(),
  grade: text("grade"),
  // level determines teaching model: nursery/kg/primary => one homeroom teacher; jhs => subject teachers
  level: text("level").notNull().default("primary"), // 'nursery' | 'kg' | 'primary' | 'jhs'
  // homeroom teacher (used for nursery/kg/primary only)
  teacherId: integer("teacher_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;

// JHS subject-teacher assignments (one row per subject per class)
export const classSubjectsTable = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  subject: text("subject").notNull(),
  teacherId: integer("teacher_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSubjectSchema = createInsertSchema(classSubjectsTable).omit({ id: true, createdAt: true });
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;
export type ClassSubject = typeof classSubjectsTable.$inferSelect;

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  name: text("name").notNull(),
  studentNumber: text("student_number").notNull(),
  classId: integer("class_id").references(() => classesTable.id),
  category: text("category").notNull().default("regular"),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  status: text("status").notNull().default("active"),
  photoUrl: text("photo_url"),
  feeWaiver: boolean("fee_waiver").notNull().default(false),
  feedingWaiver: boolean("feeding_waiver").notNull().default(false),
  busWaiver: boolean("bus_waiver").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;

// Tracks every class change for a student (promotions, demotions, transfers)
export const studentClassHistoryTable = pgTable("student_class_history", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  fromClassId: integer("from_class_id").references(() => classesTable.id),
  toClassId: integer("to_class_id").references(() => classesTable.id),
  changeType: text("change_type").notNull(), // 'enrolled' | 'promoted' | 'demoted' | 'transferred'
  academicYear: text("academic_year"),
  notes: text("notes"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentClassHistorySchema = createInsertSchema(studentClassHistoryTable).omit({ id: true, changedAt: true });
export type InsertStudentClassHistory = z.infer<typeof insertStudentClassHistorySchema>;
export type StudentClassHistory = typeof studentClassHistoryTable.$inferSelect;

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  name: text("name").notNull(),
  subject: text("subject"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  // Login credentials (assigned by school admin)
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachersTable).omit({ id: true, createdAt: true });
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;

// Terminal scores (entered by teachers per student per subject per term)
export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  classId: integer("class_id").references(() => classesTable.id),
  teacherId: integer("teacher_id").references(() => teachersTable.id),
  subject: text("subject").notNull(),
  term: text("term").notNull(),          // '1' | '2' | '3'
  academicYear: text("academic_year").notNull(),
  classWork: numeric("class_work", { precision: 5, scale: 2 }),       // max 10
  classTest: numeric("class_test", { precision: 5, scale: 2 }),       // max 20
  homework: numeric("homework", { precision: 5, scale: 2 }),          // max 5
  projectWork: numeric("project_work", { precision: 5, scale: 2 }),   // max 5
  examScore: numeric("exam_score", { precision: 5, scale: 2 }),       // max 60
  score: numeric("score", { precision: 5, scale: 2 }),                // total (computed)
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).notNull().default("100"),
  grade: text("grade"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScoreSchema = createInsertSchema(scoresTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;

// ── Discipline Records ────────────────────────────────────────────────────────
export const disciplineRecordsTable = pgTable("discipline_records", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  reportedByTeacherId: integer("reported_by_teacher_id").references(() => teachersTable.id),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'warning' | 'detention' | 'suspension' | 'commendation'
  description: text("description").notNull(),
  actionTaken: text("action_taken"),
  parentNotified: boolean("parent_notified").notNull().default(false),
  status: text("status").notNull().default("active"), // 'active' | 'resolved' | 'overridden'
  adminNotes: text("admin_notes"),
  overriddenByAdmin: boolean("overridden_by_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDisciplineRecordSchema = createInsertSchema(disciplineRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDisciplineRecord = z.infer<typeof insertDisciplineRecordSchema>;
export type DisciplineRecord = typeof disciplineRecordsTable.$inferSelect;

// ── Promotion Runs ────────────────────────────────────────────────────────────
export const promotionRunsTable = pgTable("promotion_runs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  academicYear: text("academic_year").notNull(),
  status: text("status").notNull().default("draft"), // 'draft' | 'confirmed'
  totalPromoted: integer("total_promoted").notNull().default(0),
  totalRetained: integer("total_retained").notNull().default(0),
  totalGraduated: integer("total_graduated").notNull().default(0),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PromotionRun = typeof promotionRunsTable.$inferSelect;

export const feeSettingsTable = pgTable("fee_settings", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id).unique(),
  schoolFee: numeric("school_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  busFee: numeric("bus_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  scholarshipDiscount: numeric("scholarship_discount", { precision: 5, scale: 2 }).notNull().default("0"),
  staffChildDiscount: numeric("staff_child_discount", { precision: 5, scale: 2 }).notNull().default("0"),
  termBillingEnabled: text("term_billing_enabled").notNull().default("false"),
  feedingFeePerDay: numeric("feeding_fee_per_day", { precision: 10, scale: 2 }).notNull().default("0"),
  feedingEnabled: text("feeding_enabled").notNull().default("false"),
  busFeePerDay: numeric("bus_fee_per_day", { precision: 10, scale: 2 }).notNull().default("0"),
  scholarshipWaivedFees: text("scholarship_waived_fees").notNull().default(""),
  staffChildWaivedFees: text("staff_child_waived_fees").notNull().default(""),
  term1SchoolFee: numeric("term1_school_fee", { precision: 10, scale: 2 }),
  term2SchoolFee: numeric("term2_school_fee", { precision: 10, scale: 2 }),
  term3SchoolFee: numeric("term3_school_fee", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
