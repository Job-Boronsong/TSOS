import { pgTable, text, serial, timestamp, integer, date, boolean, doublePrecision, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";
import { teachersTable } from "./students";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schoolsTable.id),
  actorId: integer("actor_id"),
  actorRole: text("actor_role"),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;

export const timetableSlotsTable = pgTable("timetable_slots", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  classId: integer("class_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  periodNumber: integer("period_number").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  subject: text("subject").notNull(),
  teacherId: integer("teacher_id").references(() => teachersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTimetableSlotSchema = createInsertSchema(timetableSlotsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTimetableSlot = z.infer<typeof insertTimetableSlotSchema>;
export type TimetableSlot = typeof timetableSlotsTable.$inferSelect;

export const academicCalendarTable = pgTable("academic_calendar", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  academicYear: text("academic_year").notNull(),
  term: text("term").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  eventType: text("event_type").notNull().default("term"),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAcademicCalendarSchema = createInsertSchema(academicCalendarTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAcademicCalendar = z.infer<typeof insertAcademicCalendarSchema>;
export type AcademicCalendar = typeof academicCalendarTable.$inferSelect;

export const teacherAttendanceTable = pgTable("teacher_attendance", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id),
  date: date("date").notNull(),
  status: text("status").notNull().default("present"),
  notes: text("notes"),
  checkInTime: timestamp("check_in_time", { withTimezone: true }),
  checkOutTime: timestamp("check_out_time", { withTimezone: true }),
  deviceInfo: text("device_info"),
  checkinLatitude: doublePrecision("checkin_latitude"),
  checkinLongitude: doublePrecision("checkin_longitude"),
  checkInMethod: text("check_in_method").default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTeacherAttendanceSchema = createInsertSchema(teacherAttendanceTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeacherAttendance = z.infer<typeof insertTeacherAttendanceSchema>;
export type TeacherAttendance = typeof teacherAttendanceTable.$inferSelect;

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  target: text("target").notNull().default("staff"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const announcementReadsTable = pgTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => announcementsTable.id),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id),
  readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEventsTable = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  category: text("category").notNull().default("academic"),
  targetType: text("target_type").notNull().default("all_staff"),
  targetIds: text("target_ids").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEventsTable.$inferSelect;

export const studentFeeledgerTable = pgTable("student_fee_ledger", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  studentId: integer("student_id").notNull(),
  academicYear: text("academic_year").notNull(),
  term: text("term").notNull(),
  feeType: text("fee_type").notNull().default("school_fee"),
  amountDue: text("amount_due").notNull().default("0"),
  amountPaid: text("amount_paid").notNull().default("0"),
  paymentDate: date("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentFeeledgerSchema = createInsertSchema(studentFeeledgerTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentFeeLedger = z.infer<typeof insertStudentFeeledgerSchema>;
export type StudentFeeLedger = typeof studentFeeledgerTable.$inferSelect;

export const academicTermsTable = pgTable("academic_terms", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAcademicTermSchema = createInsertSchema(academicTermsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAcademicTerm = z.infer<typeof insertAcademicTermSchema>;
export type AcademicTerm = typeof academicTermsTable.$inferSelect;

// ── Feeding / Canteen ─────────────────────────────────────────────────────────
import { studentsTable } from "./students";

export const feedingRecordsTable = pgTable("feeding_records", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  date: date("date").notNull(),
  status: text("status").notNull().default("fed"), // 'fed' | 'absent' | 'opted_out'
  markedByTeacherId: integer("marked_by_teacher_id").references(() => teachersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedingRecordSchema = createInsertSchema(feedingRecordsTable).omit({ id: true, createdAt: true });
export type InsertFeedingRecord = z.infer<typeof insertFeedingRecordSchema>;
export type FeedingRecord = typeof feedingRecordsTable.$inferSelect;

export const feedingFundEntriesTable = pgTable("feeding_fund_entries", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  academicYear: text("academic_year").notNull(),
  term: text("term").notNull(),
  type: text("type").notNull(), // 'credit' | 'debit'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedingFundEntrySchema = createInsertSchema(feedingFundEntriesTable).omit({ id: true, createdAt: true });
export type InsertFeedingFundEntry = z.infer<typeof insertFeedingFundEntrySchema>;
export type FeedingFundEntry = typeof feedingFundEntriesTable.$inferSelect;
