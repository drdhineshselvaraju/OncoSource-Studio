export type Role =
  | "Study Coordinator"
  | "Data Manager"
  | "Principal Investigator"
  | "Monitor";

export type SubjectStatus = "Screening" | "Active" | "Completed" | "Withdrawn";
export type RiskLevel = "Low" | "Medium" | "High";
export type FormKey = "eligibility" | "predose" | "treatment" | "adverse_event";
export type FormStatus = "Draft" | "Complete" | "Verified" | "Signed" | "Locked";
export type QueryStatus = "Open" | "Answered" | "Closed";
export type IssueSeverity = "Error" | "Warning";

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export interface FieldDefinition {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean" | "textarea" | "datetime";
  required?: boolean;
  unit?: string;
  placeholder?: string;
  options?: string[];
  cdash?: string;
  help?: string;
  span?: 1 | 2;
  min?: number;
  max?: number;
}

export interface FormDefinition {
  key: FormKey;
  shortLabel: string;
  title: string;
  description: string;
  domain: string;
  fields: FieldDefinition[];
}

export interface SubjectRecord {
  id: string;
  site: string;
  age: number;
  sex: "Female" | "Male";
  arm: string;
  status: SubjectStatus;
  currentVisit: string;
  nextVisit: string;
  completion: number;
  risk: RiskLevel;
}

export interface ValidationIssue {
  ruleId: string;
  fieldId: string;
  severity: IssueSeverity;
  message: string;
}

export interface DataQuery {
  id: string;
  subjectId: string;
  formKey: FormKey;
  fieldId: string;
  ruleId: string;
  message: string;
  severity: IssueSeverity;
  status: QueryStatus;
  openedAt: string;
  openedBy: string;
  response?: string;
  respondedAt?: string;
  closedAt?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  subjectId: string;
  formKey: FormKey;
  fieldId: string;
  fieldLabel: string;
  oldValue: FieldValue | "";
  newValue: FieldValue | "";
  reason: string;
  actor: string;
  role: Role;
  source: "Manual eSource" | "FHIR Observation" | "System workflow";
}

export interface TrialSnapshot {
  subjects: SubjectRecord[];
  records: Record<string, Record<FormKey, FieldValues>>;
  formStatuses: Record<string, FormStatus>;
  queries: DataQuery[];
  audit: AuditEvent[];
  provenance: Record<string, string>;
}

export interface StudySiteMetric {
  site: string;
  enrolled: number;
  complete: number;
  openQueries: number;
  overdue: number;
}
