import { describe, expect, it } from "vitest";

import { validateForm } from "../lib/validation";

describe("eligibility validation", () => {
  it("rejects screening before consent", () => {
    const issues = validateForm("eligibility", {
      consent_date: "2026-08-15",
      screening_date: "2026-08-14",
      age: 58,
      sex: "Male",
      histology_confirmed: true,
      ecog: "1",
    });
    expect(issues.some((issue) => issue.ruleId === "CONSENT-001")).toBe(true);
  });

  it("accepts a complete eligible record", () => {
    const issues = validateForm("eligibility", {
      consent_date: "2026-08-14",
      screening_date: "2026-08-15",
      age: 58,
      sex: "Male",
      histology_confirmed: true,
      ecog: "1",
    });
    expect(issues).toEqual([]);
  });
});

describe("pre-dose validation", () => {
  const complete = {
    visit_date: "2026-09-11",
    weight_kg: 66,
    height_cm: 169,
    anc_x10e9_l: 2.4,
    platelets_x10e9_l: 224,
    creatinine_clearance_ml_min: 78,
    laboratory_collected_at: "2026-09-11T08:20",
    treatment_planned: true,
  };

  it("flags ANC below the demonstration threshold", () => {
    const issues = validateForm("predose", { ...complete, anc_x10e9_l: 1.2 });
    expect(issues).toContainEqual(expect.objectContaining({ ruleId: "LAB-001", severity: "Warning" }));
  });

  it("flags low creatinine clearance as blocking", () => {
    const issues = validateForm("predose", { ...complete, creatinine_clearance_ml_min: 41 });
    expect(issues).toContainEqual(expect.objectContaining({ ruleId: "LAB-003", severity: "Error" }));
  });
});

describe("treatment validation", () => {
  it("requires actual dose and timing when administered", () => {
    const issues = validateForm("treatment", {
      administered: true,
      dose_mg_m2: 500,
      actual_dose_mg: "",
      dose_start: "",
      dose_end: "",
      dose_modified: false,
    });
    expect(issues.filter((issue) => issue.ruleId === "EX-001")).toHaveLength(3);
  });

  it("requires a reason for dose modification", () => {
    const issues = validateForm("treatment", {
      administered: false,
      dose_modified: true,
      modification_reason: "",
    });
    expect(issues).toContainEqual(expect.objectContaining({ ruleId: "EX-003" }));
  });
});

describe("adverse event validation", () => {
  it("preserves the distinction between severity and seriousness", () => {
    const issues = validateForm("adverse_event", {
      ae_term: "Nausea",
      ae_start_date: "2026-09-07",
      ae_grade: "3",
      ae_serious: false,
      causality: "Possible",
      action_taken: "None",
      outcome: "Recovering",
    });
    expect(issues.some((issue) => issue.ruleId === "AE-003")).toBe(false);
  });

  it("requires a criterion when serious is yes", () => {
    const issues = validateForm("adverse_event", {
      ae_term: "Febrile neutropenia",
      ae_start_date: "2026-09-07",
      ae_grade: "3",
      ae_serious: true,
      seriousness_criterion: "",
      causality: "Probable",
      action_taken: "Interrupted",
      outcome: "Recovering",
    });
    expect(issues).toContainEqual(expect.objectContaining({ ruleId: "AE-003" }));
  });
});
