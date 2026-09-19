import { formDefinitions, STUDY } from "@/lib/study-config";
import type {
  AuditEvent,
  DataQuery,
  FieldValues,
  FormKey,
  FormStatus,
  SubjectRecord,
  TrialSnapshot,
} from "@/lib/trial-types";

const siteCodes = ["CHN", "ERD", "CBE"];
const statuses: SubjectRecord["status"][] = ["Active", "Active", "Active", "Completed", "Screening"];
const risks: SubjectRecord["risk"][] = ["Low", "Low", "Medium", "Low", "High"];

export function createSubjects(): SubjectRecord[] {
  return Array.from({ length: 50 }, (_, index) => {
    const siteIndex = index % STUDY.sites.length;
    const status = statuses[index % statuses.length];
    const completionBase = status === "Completed" ? 100 : status === "Screening" ? 22 : 58 + ((index * 7) % 36);
    return {
      id: `OS-${siteCodes[siteIndex]}-${String(index + 1).padStart(4, "0")}`,
      site: STUDY.sites[siteIndex],
      age: 45 + ((index * 3) % 29),
      sex: index % 3 === 0 ? "Female" : "Male",
      arm: index % 2 === 0 ? "Investigational + SOC" : "SOC comparator",
      status,
      currentVisit: status === "Screening" ? "Screening" : status === "Completed" ? "End of study" : `Cycle ${(index % 3) + 1} Day 1`,
      nextVisit: status === "Completed" ? "Complete" : `2026-09-${String(12 + (index % 15)).padStart(2, "0")}`,
      completion: Math.min(completionBase, 100),
      risk: risks[index % risks.length],
    };
  });
}

function emptyForms(): Record<FormKey, FieldValues> {
  return Object.fromEntries(formDefinitions.map((form) => [form.key, {}])) as Record<FormKey, FieldValues>;
}

function seededForms(subject: SubjectRecord, index: number): Record<FormKey, FieldValues> {
  const consentDay = String(12 + (index % 12)).padStart(2, "0");
  const screeningDay = String(13 + (index % 12)).padStart(2, "0");
  const base = emptyForms();

  base.eligibility = {
    consent_date: `2026-08-${consentDay}`,
    screening_date: `2026-08-${screeningDay}`,
    age: subject.age,
    sex: subject.sex,
    histology_confirmed: true,
    ecog: index % 9 === 0 ? "2" : index % 3 === 0 ? "0" : "1",
    eligibility_comment: "Pathology report and source medical record reviewed at screening.",
  };

  base.predose = {
    visit_date: `2026-09-${String(4 + (index % 7)).padStart(2, "0")}`,
    weight_kg: 54 + (index % 24),
    height_cm: 154 + (index % 22),
    anc_x10e9_l: index % 11 === 0 ? 1.2 : Number((2.1 + (index % 8) * 0.21).toFixed(2)),
    platelets_x10e9_l: index % 13 === 0 ? 88 : 178 + (index % 120),
    creatinine_clearance_ml_min: index % 17 === 0 ? 41 : 62 + (index % 35),
    laboratory_collected_at: `2026-09-${String(4 + (index % 7)).padStart(2, "0")}T08:30`,
    treatment_planned: true,
  };

  base.treatment = {
    administered: true,
    dose_mg_m2: 500,
    actual_dose_mg: index % 8 === 0 ? "" : 760 + (index % 80),
    dose_start: `2026-09-${String(5 + (index % 7)).padStart(2, "0")}T10:00`,
    dose_end: `2026-09-${String(5 + (index % 7)).padStart(2, "0")}T10:24`,
    dose_modified: index % 10 === 0,
    modification_reason: index % 10 === 0 ? "Protocol-permitted renal function adjustment." : "",
  };

  base.adverse_event = index % 4 === 0
    ? {
        ae_term: index % 8 === 0 ? "Neutropenia" : "Nausea",
        ae_start_date: "2026-09-07",
        ae_end_date: index % 8 === 0 ? "" : "2026-09-09",
        ae_grade: index % 8 === 0 ? "3" : "1",
        ae_serious: index % 16 === 0,
        seriousness_criterion: index % 16 === 0 ? "Hospitalisation" : "",
        causality: "Possible",
        action_taken: index % 8 === 0 ? "Interrupted" : "None",
        outcome: index % 8 === 0 ? "Recovering" : "Recovered",
      }
    : {};

  return base;
}

function statusKey(subjectId: string, formKey: FormKey) {
  return `${subjectId}:${formKey}`;
}

export function createDemoSnapshot(): TrialSnapshot {
  const subjects = createSubjects();
  const records: TrialSnapshot["records"] = {};
  const formStatuses: Record<string, FormStatus> = {};
  const provenance: Record<string, string> = {};

  subjects.forEach((subject, index) => {
    records[subject.id] = seededForms(subject, index);
    formDefinitions.forEach((form) => {
      const isScreening = subject.status === "Screening";
      const status: FormStatus = isScreening && form.key !== "eligibility"
        ? "Draft"
        : subject.status === "Completed"
          ? "Locked"
          : form.key === "adverse_event" && Object.keys(records[subject.id].adverse_event).length === 0
            ? "Draft"
            : index % 6 === 0
              ? "Verified"
              : "Complete";
      formStatuses[statusKey(subject.id, form.key)] = status;
    });
  });

  const queries: DataQuery[] = [
    {
      id: "Q-2026-0018",
      subjectId: subjects[0].id,
      formKey: "predose",
      fieldId: "anc_x10e9_l",
      ruleId: "LAB-001",
      message: "ANC is below the protocol treatment threshold of 1.5 ×10⁹/L. Confirm result and treatment decision.",
      severity: "Warning",
      status: "Open",
      openedAt: "2026-09-11T08:42:00Z",
      openedBy: "Automatic edit check",
    },
    {
      id: "Q-2026-0017",
      subjectId: subjects[8].id,
      formKey: "treatment",
      fieldId: "actual_dose_mg",
      ruleId: "EX-001",
      message: "Actual dose is required when study treatment was administered.",
      severity: "Error",
      status: "Open",
      openedAt: "2026-09-10T12:08:00Z",
      openedBy: "Automatic edit check",
    },
    {
      id: "Q-2026-0016",
      subjectId: subjects[12].id,
      formKey: "predose",
      fieldId: "platelets_x10e9_l",
      ruleId: "LAB-002",
      message: "Platelet count is below the protocol treatment threshold. Verify source and investigator assessment.",
      severity: "Warning",
      status: "Answered",
      openedAt: "2026-09-09T11:21:00Z",
      openedBy: "Automatic edit check",
      response: "Result verified against the central laboratory report. Treatment was delayed.",
      respondedAt: "2026-09-10T07:14:00Z",
    },
    {
      id: "Q-2026-0015",
      subjectId: subjects[16].id,
      formKey: "predose",
      fieldId: "creatinine_clearance_ml_min",
      ruleId: "LAB-003",
      message: "Creatinine clearance is below the protocol eligibility threshold.",
      severity: "Error",
      status: "Closed",
      openedAt: "2026-09-08T09:35:00Z",
      openedBy: "Automatic edit check",
      response: "Entry corrected after review of the source worksheet.",
      respondedAt: "2026-09-08T10:02:00Z",
      closedAt: "2026-09-08T11:10:00Z",
    },
  ];

  const audit: AuditEvent[] = [
    {
      id: "AUD-00042",
      timestamp: "2026-09-11T08:42:00Z",
      subjectId: subjects[0].id,
      formKey: "predose",
      fieldId: "anc_x10e9_l",
      fieldLabel: "Absolute neutrophil count",
      oldValue: "",
      newValue: 1.2,
      reason: "Initial entry from central laboratory report.",
      actor: "Ananya Rao",
      role: "Study Coordinator",
      source: "Manual eSource",
    },
    {
      id: "AUD-00041",
      timestamp: "2026-09-10T12:08:00Z",
      subjectId: subjects[8].id,
      formKey: "treatment",
      fieldId: "administered",
      fieldLabel: "Study treatment administered",
      oldValue: "",
      newValue: true,
      reason: "Initial entry from administration record.",
      actor: "Kavya Menon",
      role: "Study Coordinator",
      source: "Manual eSource",
    },
    {
      id: "AUD-00040",
      timestamp: "2026-09-10T07:14:00Z",
      subjectId: subjects[12].id,
      formKey: "predose",
      fieldId: "platelets_x10e9_l",
      fieldLabel: "Platelet count",
      oldValue: 188,
      newValue: 88,
      reason: "Transcription corrected after source verification.",
      actor: "Ananya Rao",
      role: "Study Coordinator",
      source: "Manual eSource",
    },
  ];

  return { subjects, records, formStatuses, queries, audit, provenance };
}

export function getDefaultRecord(subject: SubjectRecord): Record<FormKey, FieldValues> {
  return seededForms(subject, 0);
}

export function getSiteMetrics(snapshot: TrialSnapshot) {
  return STUDY.sites.map((site) => {
    const siteSubjects = snapshot.subjects.filter((subject) => subject.site === site);
    const siteIds = new Set(siteSubjects.map((subject) => subject.id));
    return {
      site,
      enrolled: siteSubjects.length,
      complete: siteSubjects.filter((subject) => subject.status === "Completed").length,
      openQueries: snapshot.queries.filter((query) => siteIds.has(query.subjectId) && query.status !== "Closed").length,
      overdue: siteSubjects.filter((subject) => subject.status === "Active" && subject.risk === "High").length,
    };
  });
}
