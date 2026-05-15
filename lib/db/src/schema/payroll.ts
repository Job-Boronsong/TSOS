import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";
import { teachersTable } from "./students";

export const staffSalaryProfilesTable = pgTable("staff_salary_profiles", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id).unique(),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  otherAllowances: numeric("other_allowances", { precision: 12, scale: 2 }).notNull().default("0"),
  staffCategory: text("staff_category").notNull().default("teaching"), // 'teaching' | 'non_teaching'
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSalaryProfileSchema = createInsertSchema(staffSalaryProfilesTable).omit({ id: true, updatedAt: true });
export type InsertSalaryProfile = z.infer<typeof insertSalaryProfileSchema>;
export type SalaryProfile = typeof staffSalaryProfilesTable.$inferSelect;

export const payrollRunsTable = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  month: integer("month").notNull(),       // 1–12
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"), // 'draft' | 'confirmed'
  totalGross: numeric("total_gross", { precision: 14, scale: 2 }).notNull().default("0"),
  totalNet: numeric("total_net", { precision: 14, scale: 2 }).notNull().default("0"),
  totalSsnit: numeric("total_ssnit", { precision: 14, scale: 2 }).notNull().default("0"),
  totalPaye: numeric("total_paye", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PayrollRun = typeof payrollRunsTable.$inferSelect;

export const payrollEntriesTable = pgTable("payroll_entries", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id),
  runId: integer("run_id").notNull().references(() => payrollRunsTable.id),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }).notNull().default("0"),
  otherAllowances: numeric("other_allowances", { precision: 12, scale: 2 }).notNull().default("0"),
  grossSalary: numeric("gross_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  ssnitEmployee: numeric("ssnit_employee", { precision: 12, scale: 2 }).notNull().default("0"),  // 5.5% employee contribution
  ssnitEmployer: numeric("ssnit_employer", { precision: 12, scale: 2 }).notNull().default("0"),  // 13% employer contribution
  taxableIncome: numeric("taxable_income", { precision: 12, scale: 2 }).notNull().default("0"),
  payeIncomeTax: numeric("paye_income_tax", { precision: 12, scale: 2 }).notNull().default("0"),
  otherDeductions: numeric("other_deductions", { precision: 12, scale: 2 }).notNull().default("0"),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  overridden: boolean("overridden").notNull().default(false), // true if admin manually edited any field
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PayrollEntry = typeof payrollEntriesTable.$inferSelect;
