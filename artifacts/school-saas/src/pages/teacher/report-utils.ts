export const GRADE_INFO: Record<string, { label: string; color: string }> = {
  A1: { label: "Excellent",  color: "#16a34a" },
  B2: { label: "Very Good",  color: "#2563eb" },
  B3: { label: "Good",       color: "#3b82f6" },
  C4: { label: "Credit",     color: "#ca8a04" },
  C5: { label: "Credit",     color: "#d97706" },
  C6: { label: "Credit",     color: "#f59e0b" },
  D7: { label: "Pass",       color: "#ea580c" },
  E8: { label: "Pass",       color: "#dc2626" },
  F9: { label: "Fail",       color: "#b91c1c" },
};

export const COMPONENTS = [
  { key: "classWork",   label: "Class Work",   abbr: "CW",   max: 10  },
  { key: "classTest",   label: "Class Test",   abbr: "CT",   max: 20  },
  { key: "homework",    label: "Homework",     abbr: "HW",   max: 5   },
  { key: "projectWork", label: "Project Work", abbr: "PW",   max: 5   },
  { key: "examScore",   label: "Exam",         abbr: "Exam", max: 60  },
] as const;

export type ComponentKey = (typeof COMPONENTS)[number]["key"];

export function computeGrade(total: number): { grade: string; remarks: string } {
  if (total >= 80) return { grade: "A1", remarks: "Excellent" };
  if (total >= 70) return { grade: "B2", remarks: "Very Good" };
  if (total >= 60) return { grade: "B3", remarks: "Good" };
  if (total >= 55) return { grade: "C4", remarks: "Credit" };
  if (total >= 50) return { grade: "C5", remarks: "Credit" };
  if (total >= 45) return { grade: "C6", remarks: "Credit" };
  if (total >= 40) return { grade: "D7", remarks: "Pass" };
  if (total >= 35) return { grade: "E8", remarks: "Pass" };
  return { grade: "F9", remarks: "Fail" };
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
