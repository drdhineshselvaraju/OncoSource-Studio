import type { FieldValues, FormKey, ValidationIssue } from "@/lib/trial-types";

function blank(value: unknown) {
  return value === undefined || value === null || value === "";
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

export function validateForm(formKey: FormKey, values: FieldValues): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (formKey === "eligibility") {
    if (blank(values.consent_date)) {
      issues.push({ ruleId: "REQ-001", fieldId: "consent_date", severity: "Error", message: "Informed consent date is required." });
    }
    if (blank(values.screening_date)) {
      issues.push({ ruleId: "REQ-002", fieldId: "screening_date", severity: "Error", message: "Screening assessment date is required." });
    }
    if (values.consent_date && values.screening_date && String(values.screening_date) < String(values.consent_date)) {
      issues.push({ ruleId: "CONSENT-001", fieldId: "screening_date", severity: "Error", message: "Screening cannot occur before informed consent." });
    }
    if (blank(values.age) || asNumber(values.age) < 18) {
      issues.push({ ruleId: "ELIG-001", fieldId: "age", severity: "Error", message: "Participant must be at least 18 years old at consent." });
    }
    if (values.histology_confirmed !== true) {
      issues.push({ ruleId: "ELIG-002", fieldId: "histology_confirmed", severity: "Error", message: "Histological confirmation is required by the demonstration protocol." });
    }
    if (blank(values.ecog) || asNumber(values.ecog) > 1) {
      issues.push({ ruleId: "ELIG-003", fieldId: "ecog", severity: "Error", message: "Protocol eligibility requires ECOG performance status 0 or 1." });
    }
  }

  if (formKey === "predose") {
    const required = ["visit_date", "weight_kg", "height_cm", "anc_x10e9_l", "platelets_x10e9_l", "creatinine_clearance_ml_min", "laboratory_collected_at"];
    required.forEach((fieldId) => {
      if (blank(values[fieldId])) {
        issues.push({ ruleId: `REQ-${fieldId.toUpperCase()}`, fieldId, severity: "Error", message: "This pre-dose field is required." });
      }
    });
    if (!blank(values.anc_x10e9_l) && asNumber(values.anc_x10e9_l) < 1.5) {
      issues.push({ ruleId: "LAB-001", fieldId: "anc_x10e9_l", severity: "Warning", message: "ANC is below the protocol treatment threshold of 1.5 ×10⁹/L. Confirm result and treatment decision." });
    }
    if (!blank(values.platelets_x10e9_l) && asNumber(values.platelets_x10e9_l) < 100) {
      issues.push({ ruleId: "LAB-002", fieldId: "platelets_x10e9_l", severity: "Warning", message: "Platelet count is below the protocol treatment threshold of 100 ×10⁹/L." });
    }
    if (!blank(values.creatinine_clearance_ml_min) && asNumber(values.creatinine_clearance_ml_min) < 45) {
      issues.push({ ruleId: "LAB-003", fieldId: "creatinine_clearance_ml_min", severity: "Error", message: "Creatinine clearance is below the demonstration protocol threshold of 45 mL/min." });
    }
  }

  if (formKey === "treatment") {
    if (values.administered === true) {
      ["dose_mg_m2", "actual_dose_mg", "dose_start", "dose_end"].forEach((fieldId) => {
        if (blank(values[fieldId])) {
          issues.push({ ruleId: "EX-001", fieldId, severity: "Error", message: "Dose and administration timing are required when treatment was administered." });
        }
      });
    }
    if (values.dose_start && values.dose_end && String(values.dose_end) < String(values.dose_start)) {
      issues.push({ ruleId: "EX-002", fieldId: "dose_end", severity: "Error", message: "Administration end cannot precede administration start." });
    }
    if (values.dose_modified === true && blank(values.modification_reason)) {
      issues.push({ ruleId: "EX-003", fieldId: "modification_reason", severity: "Error", message: "A modification reason is required when the dose was modified." });
    }
  }

  if (formKey === "adverse_event" && !blank(values.ae_term)) {
    ["ae_start_date", "ae_grade", "causality", "action_taken", "outcome"].forEach((fieldId) => {
      if (blank(values[fieldId])) {
        issues.push({ ruleId: "AE-001", fieldId, severity: "Error", message: "Complete all core adverse-event fields when an event is recorded." });
      }
    });
    if (values.ae_start_date && values.ae_end_date && String(values.ae_end_date) < String(values.ae_start_date)) {
      issues.push({ ruleId: "AE-002", fieldId: "ae_end_date", severity: "Error", message: "Adverse-event end date cannot precede the start date." });
    }
    if (values.ae_serious === true && blank(values.seriousness_criterion)) {
      issues.push({ ruleId: "AE-003", fieldId: "seriousness_criterion", severity: "Error", message: "Seriousness criterion is required when the event is serious." });
    }
  }

  return issues;
}

export function validateRequiredField(value: unknown, required?: boolean) {
  return required && blank(value);
}
