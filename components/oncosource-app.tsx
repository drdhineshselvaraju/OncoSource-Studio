"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  CloudDownload,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileJson,
  FileSpreadsheet,
  GitBranch,
  History,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareWarning,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { createDemoSnapshot, getSiteMetrics } from "@/lib/demo-data";
import {
  auditToCsv,
  domainToCsv,
  downloadText,
  exportManifest,
  snapshotToOdm,
} from "@/lib/exporters";
import { formByKey, formDefinitions, STUDY } from "@/lib/study-config";
import type {
  AuditEvent,
  DataQuery,
  FieldDefinition,
  FieldValue,
  FieldValues,
  FormKey,
  FormStatus,
  QueryStatus,
  Role,
  SubjectRecord,
  TrialSnapshot,
} from "@/lib/trial-types";
import { validateForm } from "@/lib/validation";

type ViewKey = "dashboard" | "subjects" | "capture" | "queries" | "audit" | "exports";

const STORAGE_KEY = "oncosource-studio-demo-v1";
const ACTORS: Record<Role, string> = {
  "Study Coordinator": "Ananya Rao",
  "Data Manager": "Rohan Iyer",
  "Principal Investigator": "Dr. Meera Nair",
  Monitor: "Leena Joseph",
};

const navItems: Array<{ id: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Study overview", icon: LayoutDashboard },
  { id: "subjects", label: "Participants", icon: Users },
  { id: "capture", label: "eSource capture", icon: ClipboardCheck },
  { id: "queries", label: "Data queries", icon: MessageSquareWarning },
  { id: "audit", label: "Audit trail", icon: History },
  { id: "exports", label: "Data exports", icon: CloudDownload },
];

const statusTone: Record<FormStatus, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Complete: "border-cyan-200 bg-cyan-50 text-cyan-800",
  Verified: "border-blue-200 bg-blue-50 text-blue-800",
  Signed: "border-violet-200 bg-violet-50 text-violet-800",
  Locked: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function formStatusKey(subjectId: string, formKey: FormKey) {
  return subjectId + ":" + formKey;
}

function provenanceKey(subjectId: string, fieldId: string) {
  return subjectId + ":" + fieldId;
}

function humanValue(value: FieldValue | "") {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === "") return "Blank";
  return String(value);
}

function displayDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: value.includes("T") ? "2-digit" : undefined,
      minute: value.includes("T") ? "2-digit" : undefined,
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function safeSnapshot(value: string | null): TrialSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as TrialSnapshot;
    if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.queries) || !Array.isArray(parsed.audit)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isBlank(value: FieldValue | undefined) {
  return value === undefined || value === "";
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Activity;
  tone: "teal" | "amber" | "blue" | "rose";
}) {
  const colors = {
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  return (
    <article className="metric-card">
      <div className={"flex h-10 w-10 items-center justify-center rounded-xl ring-1 " + colors[tone]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className="text-right text-xs leading-5 text-slate-500">{detail}</span>
      </div>
    </article>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DashboardView({
  snapshot,
  openCapture,
  openQueries,
}: {
  snapshot: TrialSnapshot;
  openCapture: (subjectId: string) => void;
  openQueries: () => void;
}) {
  const siteMetrics = getSiteMetrics(snapshot);
  const open = snapshot.queries.filter((query) => query.status === "Open").length;
  const answered = snapshot.queries.filter((query) => query.status === "Answered").length;
  const active = snapshot.subjects.filter((subject) => subject.status === "Active").length;
  const completedForms = Object.values(snapshot.formStatuses).filter((status) => status !== "Draft").length;
  const totalForms = snapshot.subjects.length * formDefinitions.length;
  const completeness = Math.round((completedForms / totalForms) * 100);
  const highRisk = snapshot.subjects.filter((subject) => subject.risk === "High");

  return (
    <>
      <PageHeading
        eyebrow="Live study workspace"
        title="Study oversight"
        description={"Data cut " + STUDY.dataCut + ". Review enrolment, data completeness and issues requiring action across three synthetic sites."}
        action={
          <Button className="bg-[#0e766e] hover:bg-[#0a5f59]" onClick={() => openCapture(snapshot.subjects[0].id)}>
            Open active casebook <ChevronRight />
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study metrics">
        <MetricCard label="Participants" value={snapshot.subjects.length} detail={active + " active"} icon={Users} tone="blue" />
        <MetricCard label="Data completeness" value={completeness + "%"} detail={completedForms + " forms reviewed"} icon={FileCheck2} tone="teal" />
        <MetricCard label="Open queries" value={open + answered} detail={answered + " awaiting closure"} icon={MessageSquareWarning} tone="amber" />
        <MetricCard label="High-risk records" value={highRisk.length} detail="Rule-based review" icon={AlertTriangle} tone="rose" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Site data quality</h2>
              <p className="panel-subtitle">Enrolment and outstanding review activity</p>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">3 sites</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Site</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Complete</TableHead>
                <TableHead>Open queries</TableHead>
                <TableHead>Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteMetrics.map((site) => (
                <TableRow key={site.site}>
                  <TableCell className="font-medium text-slate-800">{site.site}</TableCell>
                  <TableCell>{site.enrolled}</TableCell>
                  <TableCell>{site.complete}</TableCell>
                  <TableCell>
                    <span className={site.openQueries ? "font-semibold text-amber-700" : "text-slate-500"}>{site.openQueries}</span>
                  </TableCell>
                  <TableCell>{site.overdue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </article>

        <article className="panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="panel-title">Query workflow</h2>
              <p className="panel-subtitle">Current discrepancy states</p>
            </div>
            <Button variant="ghost" size="sm" onClick={openQueries}>Review</Button>
          </div>
          <div className="mt-6 space-y-5">
            {[
              { label: "Open", value: open, color: "bg-rose-500" },
              { label: "Answered", value: answered, color: "bg-amber-500" },
              { label: "Closed", value: snapshot.queries.filter((query) => query.status === "Closed").length, color: "bg-teal-600" },
            ].map((item) => {
              const max = Math.max(snapshot.queries.length, 1);
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-950">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={"h-full rounded-full " + item.color} style={{ width: Math.max((item.value / max) * 100, item.value ? 12 : 0) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-7 rounded-xl border border-teal-100 bg-teal-50/80 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-teal-700" />
              <div>
                <p className="text-sm font-semibold text-teal-950">Data-integrity control</p>
                <p className="mt-1 text-xs leading-5 text-teal-800">Corrections preserve the previous value, actor, timestamp, source and reason for change.</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="panel-title">Records needing attention</h2>
              <p className="panel-subtitle">Prioritised by protocol and data-quality rules</p>
            </div>
            <CircleAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {highRisk.slice(0, 4).map((subject) => (
              <button
                type="button"
                key={subject.id}
                onClick={() => openCapture(subject.id)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{subject.id}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{subject.site} · {subject.currentVisit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700" variant="outline">High risk</Badge>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="panel p-5">
          <div>
            <h2 className="panel-title">Recent audit activity</h2>
            <p className="panel-subtitle">Latest attributable record changes</p>
          </div>
          <div className="mt-4 space-y-4">
            {snapshot.audit.slice(0, 4).map((event) => (
              <div className="flex gap-3" key={event.id}>
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100">
                  <History className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{event.subjectId} · {event.fieldLabel}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{event.actor} changed “{humanValue(event.oldValue)}” to “{humanValue(event.newValue)}”</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function SubjectsView({
  subjects,
  queries,
  openCapture,
}: {
  subjects: SubjectRecord[];
  queries: DataQuery[];
  openCapture: (subjectId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const visible = useMemo(
    () => subjects.filter((subject) => {
      const matchesSearch = (subject.id + " " + subject.site).toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || subject.status === filter;
      return matchesSearch && matchesFilter;
    }),
    [subjects, search, filter],
  );

  return (
    <>
      <PageHeading
        eyebrow="Participant management"
        title="Synthetic participant casebooks"
        description="Review enrolment state, current visit, completion and unresolved data queries. All records are fictional and contain no protected health information."
      />
      <section className="panel">
        <div className="panel-header flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search participants"
              className="h-10 border-slate-200 bg-white pl-9"
              placeholder="Search participant ID or site"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger aria-label="Filter by participant status" className="h-10 w-full border-slate-200 bg-white lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "Screening", "Active", "Completed", "Withdrawn"].map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="h-10 justify-center rounded-md border-slate-200 px-3 text-slate-600">{visible.length} records</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Participant</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current visit</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Queries</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead><span className="sr-only">Action</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.slice(0, 18).map((subject) => {
              const openQueries = queries.filter((query) => query.subjectId === subject.id && query.status !== "Closed").length;
              return (
                <TableRow key={subject.id}>
                  <TableCell>
                    <button type="button" onClick={() => openCapture(subject.id)} className="font-semibold text-[#0e766e] hover:underline">
                      {subject.id}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-slate-600">{subject.site}</TableCell>
                  <TableCell><StatusPill value={subject.status} /></TableCell>
                  <TableCell>{subject.currentVisit}</TableCell>
                  <TableCell>
                    <div className="flex w-36 items-center gap-2">
                      <Progress value={subject.completion} className="h-2" />
                      <span className="text-xs text-slate-500">{subject.completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={openQueries ? "font-semibold text-amber-700" : "text-slate-400"}>{openQueries}</span>
                  </TableCell>
                  <TableCell><RiskPill value={subject.risk} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openCapture(subject.id)}>
                      Open <ChevronRight />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {visible.length > 18 && (
          <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500">
            Showing 18 of {visible.length} filtered records. Use search to locate another participant.
          </div>
        )}
      </section>
    </>
  );
}

function StatusPill({ value }: { value: SubjectRecord["status"] }) {
  const tone = {
    Active: "border-blue-200 bg-blue-50 text-blue-700",
    Screening: "border-amber-200 bg-amber-50 text-amber-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Withdrawn: "border-slate-200 bg-slate-100 text-slate-600",
  }[value];
  return <Badge variant="outline" className={tone}>{value}</Badge>;
}

function RiskPill({ value }: { value: SubjectRecord["risk"] }) {
  const tone = {
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Medium: "border-amber-200 bg-amber-50 text-amber-700",
    High: "border-rose-200 bg-rose-50 text-rose-700",
  }[value];
  return <Badge variant="outline" className={tone}>{value}</Badge>;
}

function FieldControl({
  field,
  value,
  disabled,
  invalid,
  provenance,
  onChange,
}: {
  field: FieldDefinition;
  value: FieldValue | undefined;
  disabled: boolean;
  invalid: boolean;
  provenance?: string;
  onChange: (value: FieldValue) => void;
}) {
  const describedBy = field.id + "-help";
  return (
    <div className={field.span === 2 ? "md:col-span-2" : ""}>
      <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
        <label htmlFor={field.id} className="text-sm font-semibold text-slate-800">
          {field.label}{field.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
        <div className="flex items-center gap-1.5">
          {provenance ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  <Database className="h-3 w-3" /> FHIR
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{provenance}</TooltipContent>
            </Tooltip>
          ) : null}
          {field.cdash ? <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">{field.cdash}</Badge> : null}
        </div>
      </div>

      {field.type === "select" ? (
        <Select value={String(value ?? "")} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={field.id} aria-invalid={invalid} aria-describedby={describedBy} className="h-11 w-full border-slate-200 bg-white">
            <SelectValue placeholder="Select a value" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={field.label}>
          {[true, false].map((choice) => (
            <button
              key={String(choice)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(choice)}
              className={"flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition " +
                (value === choice
                  ? "border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300") +
                (disabled ? " cursor-not-allowed opacity-60" : "")}
            >
              {value === choice ? <Check className="h-4 w-4" /> : null}
              {choice ? "Yes" : "No"}
            </button>
          ))}
        </div>
      ) : field.type === "textarea" ? (
        <Textarea
          id={field.id}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="min-h-24 border-slate-200 bg-white"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="relative">
          <Input
            id={field.id}
            type={field.type === "datetime" ? "datetime-local" : field.type}
            value={value === undefined ? "" : String(value)}
            min={field.min}
            max={field.max}
            step={field.type === "number" ? "any" : undefined}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={"h-11 border-slate-200 bg-white " + (field.unit ? "pr-20" : "")}
            onChange={(event) => onChange(field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)}
          />
          {field.unit ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">{field.unit}</span> : null}
        </div>
      )}
      <p id={describedBy} className="mt-1.5 min-h-5 text-xs leading-5 text-slate-500">
        {field.help ?? "Source: site record unless imported with documented provenance."}
      </p>
    </div>
  );
}

function CaptureView({
  snapshot,
  subject,
  activeForm,
  setActiveForm,
  draft,
  updateField,
  save,
  importFhir,
  transitionStatus,
  role,
  openSubjectList,
}: {
  snapshot: TrialSnapshot;
  subject: SubjectRecord;
  activeForm: FormKey;
  setActiveForm: (key: FormKey) => void;
  draft: FieldValues;
  updateField: (fieldId: string, value: FieldValue) => void;
  save: () => void;
  importFhir: () => void;
  transitionStatus: (status: FormStatus) => void;
  role: Role;
  openSubjectList: () => void;
}) {
  const issues = validateForm(activeForm, draft);
  const status = snapshot.formStatuses[formStatusKey(subject.id, activeForm)] ?? "Draft";
  const locked = status === "Locked";
  const issueByField = new Map(issues.map((issue) => [issue.fieldId, issue]));
  const subjectQueries = snapshot.queries.filter((query) => query.subjectId === subject.id && query.status !== "Closed");

  const allowedTransition = role === "Monitor" && status === "Complete"
    ? "Verified"
    : role === "Principal Investigator" && (status === "Complete" || status === "Verified") && !issues.some((issue) => issue.severity === "Error")
      ? "Signed"
      : role === "Data Manager" && status === "Signed"
        ? "Locked"
        : null;

  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <button type="button" onClick={openSubjectList} className="mb-3 text-sm font-medium text-teal-700 hover:underline">← Participant list</button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{subject.id}</h1>
            <StatusPill value={subject.status} />
            <RiskPill value={subject.risk} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{subject.site} · {subject.arm} · Current visit: {subject.currentVisit}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeForm === "predose" && !locked ? (
            <Button variant="outline" onClick={importFhir} className="border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100">
              <Database /> Import mock FHIR
            </Button>
          ) : null}
          <Button onClick={save} disabled={locked} className="bg-[#0e766e] hover:bg-[#0a5f59]">
            <Save /> Save source record
          </Button>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <article className="panel overflow-visible">
          <Tabs value={activeForm} onValueChange={(value) => setActiveForm(value as FormKey)}>
            <div className="border-b border-slate-200 px-4 pt-3">
              <TabsList variant="line" className="h-auto w-full justify-start overflow-x-auto">
                {formDefinitions.map((item) => {
                  const itemStatus = snapshot.formStatuses[formStatusKey(subject.id, item.key)] ?? "Draft";
                  return (
                    <TabsTrigger key={item.key} value={item.key} className="min-w-fit px-3 pb-3">
                      {item.shortLabel}
                      <span className={"h-1.5 w-1.5 rounded-full " + (itemStatus === "Draft" ? "bg-slate-300" : itemStatus === "Locked" ? "bg-emerald-500" : "bg-cyan-500")} />
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            {formDefinitions.map((item) => (
              <TabsContent key={item.key} value={item.key}>
                <div className="panel-header items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="panel-title">{item.title}</h2>
                      <Badge variant="outline" className={statusTone[status]}>{status}</Badge>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Domains {item.domain}</Badge>
                </div>

                {locked ? (
                  <div className="mx-5 mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <LockKeyhole className="mt-0.5 h-5 w-5 flex-none" />
                    <div>
                      <p className="text-sm font-semibold">Form locked</p>
                      <p className="mt-1 text-xs leading-5">Data are read-only. A controlled unlock action would be required in a validated production system.</p>
                    </div>
                  </div>
                ) : null}

                {issues.length ? (
                  <div className="mx-5 mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-700" />
                      <p className="text-sm font-semibold text-amber-950">{issues.length} validation {issues.length === 1 ? "issue" : "issues"}</p>
                    </div>
                    <ul className="mt-2 space-y-1 pl-7 text-xs leading-5 text-amber-900">
                      {issues.slice(0, 4).map((issue) => <li key={issue.ruleId + issue.fieldId}>{issue.ruleId}: {issue.message}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900">
                    <CheckCircle2 className="h-5 w-5" /> No active edit-check findings on this form.
                  </div>
                )}

                <div className="grid gap-x-6 gap-y-5 p-5 md:grid-cols-2">
                  {item.fields.map((field) => (
                    <div key={field.id} className={field.span === 2 ? "md:col-span-2" : ""}>
                      <FieldControl
                        field={field}
                        value={draft[field.id]}
                        disabled={locked}
                        invalid={issueByField.has(field.id)}
                        provenance={snapshot.provenance[provenanceKey(subject.id, field.id)]}
                        onChange={(value) => updateField(field.id, value)}
                      />
                      {issueByField.has(field.id) ? (
                        <p className="-mt-1 text-xs font-medium leading-5 text-rose-700">{issueByField.get(field.id)?.message}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </article>

        <aside className="space-y-5">
          <article className="panel p-5">
            <h2 className="panel-title">Review workflow</h2>
            <p className="panel-subtitle">Role: {role}</p>
            <div className="mt-5 space-y-3">
              {["Draft", "Complete", "Verified", "Signed", "Locked"].map((step, index) => {
                const order = ["Draft", "Complete", "Verified", "Signed", "Locked"];
                const currentIndex = order.indexOf(status);
                const complete = index <= currentIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={"flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold " + (complete ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-400")}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={"text-sm " + (step === status ? "font-semibold text-slate-950" : "text-slate-500")}>{step}</span>
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              className="mt-5 w-full border-slate-200"
              disabled={!allowedTransition}
              onClick={() => allowedTransition && transitionStatus(allowedTransition)}
            >
              {allowedTransition === "Verified" ? <Eye /> : allowedTransition === "Signed" ? <BookOpenCheck /> : <LockKeyhole />}
              {allowedTransition ? "Mark as " + allowedTransition.toLowerCase() : "No action for current role"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Monitor verifies, investigator signs and data manager locks after all blocking issues are cleared.</p>
          </article>

          <article className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="panel-title">Open queries</h2>
              <Badge variant="outline" className={subjectQueries.length ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500"}>{subjectQueries.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {subjectQueries.length ? subjectQueries.slice(0, 3).map((query) => (
                <div key={query.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500">{query.ruleId}</span>
                    <StatusPillQuery value={query.status} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-700">{query.message}</p>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-teal-600" />
                  <p className="mt-2 text-xs text-slate-500">No unresolved queries for this participant.</p>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-[#102a43] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-teal-300" />
              <h2 className="text-sm font-semibold">Source provenance</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">Imported data retain the source resource, observation identifier and timestamp. Manual corrections require a reason and create a new audit event.</p>
          </article>
        </aside>
      </section>
    </>
  );
}

function StatusPillQuery({ value }: { value: QueryStatus }) {
  const tone = {
    Open: "border-rose-200 bg-rose-50 text-rose-700",
    Answered: "border-amber-200 bg-amber-50 text-amber-700",
    Closed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[value];
  return <Badge variant="outline" className={tone}>{value}</Badge>;
}

function QueriesView({
  snapshot,
  role,
  actOnQuery,
  openCapture,
}: {
  snapshot: TrialSnapshot;
  role: Role;
  actOnQuery: (query: DataQuery) => void;
  openCapture: (subjectId: string, formKey: FormKey) => void;
}) {
  const [filter, setFilter] = useState<QueryStatus | "All">("All");
  const visible = snapshot.queries.filter((query) => filter === "All" || query.status === filter);
  return (
    <>
      <PageHeading
        eyebrow="Discrepancy management"
        title="Data queries"
        description="Review automatic edit-check findings, site responses and closure decisions. Query actions follow the currently selected simulated role."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "Open", "Answered", "Closed"] as const).map((status) => (
          <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)} className={filter === status ? "bg-[#102a43]" : "border-slate-200 bg-white"}>
            {status} {status === "All" ? snapshot.queries.length : snapshot.queries.filter((query) => query.status === status).length}
          </Button>
        ))}
      </div>
      <section className="panel">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Query</TableHead>
              <TableHead>Participant / form</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((query) => {
              const canRespond = query.status === "Open" && (role === "Study Coordinator" || role === "Principal Investigator");
              const canClose = query.status === "Answered" && role === "Data Manager";
              return (
                <TableRow key={query.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{query.id}</p>
                    <p className="mt-1 text-xs text-slate-500">{query.ruleId} · {query.severity}</p>
                  </TableCell>
                  <TableCell>
                    <button type="button" onClick={() => openCapture(query.subjectId, query.formKey)} className="font-semibold text-teal-700 hover:underline">{query.subjectId}</button>
                    <p className="mt-1 text-xs capitalize text-slate-500">{formByKey[query.formKey].shortLabel} · {query.fieldId.replaceAll("_", " ")}</p>
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-sm leading-6 text-slate-700">{query.message}</TableCell>
                  <TableCell><StatusPillQuery value={query.status} /></TableCell>
                  <TableCell className="text-xs text-slate-500">{displayDate(query.openedAt)}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-xs leading-5 text-slate-600">{query.response ?? "No response recorded"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" disabled={!canRespond && !canClose} onClick={() => actOnQuery(query)}>
                      {canClose ? "Close" : canRespond ? "Respond" : "View only"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function AuditView({ audit }: { audit: AuditEvent[] }) {
  const [search, setSearch] = useState("");
  const visible = audit.filter((event) => (event.subjectId + " " + event.fieldLabel + " " + event.actor + " " + event.reason).toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeading
        eyebrow="Data integrity"
        title="Append-only audit trail"
        description="Every committed change records the previous and new value, attributable actor, role, timestamp, source and reason. Events cannot be edited from this interface."
        action={
          <Button variant="outline" onClick={() => downloadText("oncosource-audit-trail.csv", auditToCsv(audit), "text/csv")}>
            <Download /> Export audit CSV
          </Button>
        }
      />
      <section className="panel">
        <div className="panel-header">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Search audit trail" className="h-10 border-slate-200 bg-white pl-9" placeholder="Search participant, field, actor or reason" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Badge variant="outline" className="border-slate-200 text-slate-600">{visible.length} events</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Timestamp</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Actor / source</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-xs text-slate-500">{displayDate(event.timestamp)}</TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-900">{event.subjectId}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">{formByKey[event.formKey]?.shortLabel ?? "Workflow"}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-slate-800">{event.fieldLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.fieldId}</p>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs items-center gap-2 whitespace-normal text-xs">
                    <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">{humanValue(event.oldValue)}</span>
                    <ChevronRight className="h-3 w-3 flex-none text-slate-400" />
                    <span className="rounded bg-teal-50 px-2 py-1 text-teal-700">{humanValue(event.newValue)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium text-slate-700">{event.actor}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.role} · {event.source}</p>
                </TableCell>
                <TableCell className="max-w-sm whitespace-normal text-xs leading-5 text-slate-600">{event.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function ExportsView({ snapshot }: { snapshot: TrialSnapshot }) {
  const exportCards = [
    {
      title: "Complete study snapshot",
      detail: "Synthetic source records, form states, queries, provenance and audit events.",
      icon: FileJson,
      format: "JSON",
      action: () => downloadText("oncosource-study-snapshot.json", exportManifest(snapshot), "application/json"),
    },
    {
      title: "CDISC ODM demonstration",
      detail: "Vendor-neutral XML-shaped exchange package with study metadata and clinical data.",
      icon: GitBranch,
      format: "XML",
      action: () => downloadText("oncosource-odm.xml", snapshotToOdm(snapshot), "application/xml"),
    },
    {
      title: "SDTM-oriented domains",
      detail: "Training exports for DM, LB, AE and EX. Not submission-ready datasets.",
      icon: FileSpreadsheet,
      format: "4 CSV files",
      action: () => {
        ["DM", "LB", "AE", "EX"].forEach((domain) => downloadText("oncosource-" + domain.toLowerCase() + ".csv", domainToCsv(snapshot, domain as "DM" | "LB" | "AE" | "EX"), "text/csv"));
      },
    },
    {
      title: "Audit trail",
      detail: "Attributable record of committed value changes and workflow actions.",
      icon: Archive,
      format: "CSV",
      action: () => downloadText("oncosource-audit-trail.csv", auditToCsv(snapshot.audit), "text/csv"),
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Interoperability"
        title="Clinical-data export centre"
        description="Generate transparent, inspectable training packages from the current synthetic study state. Each export identifies its educational and non-validated status."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {exportCards.map((card) => (
          <article key={card.title} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <card.icon className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">{card.format}</Badge>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
            <Button variant="outline" onClick={card.action} className="mt-5 border-slate-200">
              <Download /> Generate export
            </Button>
          </article>
        ))}
      </section>

      <section className="panel mt-5 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="panel-title">Collection-to-tabulation mapping</h2>
            <p className="panel-subtitle">Illustrative traceability from eSource fields to downstream domains</p>
          </div>
          <Badge className="border-amber-200 bg-amber-50 text-amber-800" variant="outline">Not for regulatory submission</Badge>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>eSource form</TableHead>
              <TableHead>Collected example</TableHead>
              <TableHead>CDASH variable</TableHead>
              <TableHead>Target domain</TableHead>
              <TableHead>Transformation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Consent and eligibility", "Age at consent", "AGE", "DM", "Direct; AGEU = YEARS"],
              ["Pre-dose assessment", "Absolute neutrophil count", "LBORRES", "LB", "One record per test; standard unit"],
              ["Study treatment", "Actual dose administered", "EXDOSE", "EX", "Direct with EXDOSU = mg"],
              ["Adverse event", "Serious adverse event", "AESER", "AE", "Boolean mapped to Y/N"],
              ["Adverse event", "CTCAE grade", "AETOXGR", "AE", "Controlled numeric character value"],
            ].map((row) => (
              <TableRow key={row[1]}>
                {row.map((cell, index) => <TableCell key={cell} className={index === 1 ? "font-medium text-slate-800" : "text-slate-600"}>{cell}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

interface WebModelContext {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
}

export function OncoSourceApp() {
  const initial = useMemo(() => createDemoSnapshot(), []);
  const [snapshot, setSnapshot] = useState<TrialSnapshot>(initial);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [role, setRole] = useState<Role>("Study Coordinator");
  const [selectedSubjectId, setSelectedSubjectId] = useState(initial.subjects[0].id);
  const [activeForm, setActiveForm] = useState<FormKey>("eligibility");
  const [draft, setDraft] = useState<FieldValues>(initial.records[initial.subjects[0].id].eligibility);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingSource, setPendingSource] = useState<AuditEvent["source"]>("Manual eSource");
  const baselineRef = useRef<FieldValues>(initial.records[initial.subjects[0].id].eligibility);
  const snapshotRef = useRef(snapshot);

  const subject = snapshot.subjects.find((item) => item.id === selectedSubjectId) ?? snapshot.subjects[0];

  useEffect(() => {
    const stored = safeSnapshot(window.localStorage.getItem(STORAGE_KEY));
    // Client-only hydration keeps the server render deterministic while restoring the demo session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setSnapshot(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    snapshotRef.current = snapshot;
  }, [snapshot, ready]);

  useEffect(() => {
    const values = snapshot.records[selectedSubjectId]?.[activeForm] ?? {};
    // The editable buffer is intentionally reset when the selected casebook form changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({ ...values });
    baselineRef.current = { ...values };
    setPendingSource("Manual eSource");
  }, [selectedSubjectId, activeForm, snapshot.records]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: WebModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: "open_subject_record",
          title: "Open participant record",
          description: "Open a synthetic trial participant in the visible eSource casebook.",
          inputSchema: {
            type: "object",
            properties: { subjectId: { type: "string", description: "Exact synthetic participant ID" } },
            required: ["subjectId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input) {
            const subjectId = String(input.subjectId ?? "");
            const exists = snapshotRef.current.subjects.some((item) => item.id === subjectId);
            if (!exists) throw new Error("Synthetic participant not found");
            setSelectedSubjectId(subjectId);
            setView("capture");
            return { subjectId, view: "eSource capture" };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: "create_data_query",
          title: "Create data query",
          description: "Create an open manual query against a field in a synthetic participant form.",
          inputSchema: {
            type: "object",
            properties: {
              subjectId: { type: "string" },
              formKey: { type: "string", enum: formDefinitions.map((form) => form.key) },
              fieldId: { type: "string" },
              message: { type: "string", minLength: 8 },
            },
            required: ["subjectId", "formKey", "fieldId", "message"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const subjectId = String(input.subjectId ?? "");
            const formKey = String(input.formKey ?? "") as FormKey;
            const fieldId = String(input.fieldId ?? "");
            const message = String(input.message ?? "");
            if (!snapshotRef.current.subjects.some((item) => item.id === subjectId)) throw new Error("Synthetic participant not found");
            if (!formByKey[formKey]) throw new Error("Form not found");
            if (!formByKey[formKey].fields.some((field) => field.id === fieldId)) throw new Error("Field not found in form");
            if (message.length < 8) throw new Error("Query message is too short");
            const query: DataQuery = {
              id: "Q-MAN-" + String(Date.now()).slice(-6),
              subjectId,
              formKey,
              fieldId,
              ruleId: "MANUAL",
              message,
              severity: "Warning",
              status: "Open",
              openedAt: new Date().toISOString(),
              openedBy: ACTORS["Data Manager"],
            };
            setSnapshot((current) => ({ ...current, queries: [query, ...current.queries] }));
            return { queryId: query.id, status: query.status, subjectId };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const openCapture = (subjectId: string, formKey?: FormKey) => {
    setSelectedSubjectId(subjectId);
    if (formKey) setActiveForm(formKey);
    setView("capture");
    setMobileNav(false);
  };

  const updateField = (fieldId: string, value: FieldValue) => {
    setDraft((current) => ({ ...current, [fieldId]: value }));
  };

  const changedFields = () => {
    const keys = new Set([...Object.keys(baselineRef.current), ...Object.keys(draft)]);
    return [...keys].filter((key) => baselineRef.current[key] !== draft[key]);
  };

  const commitSave = (changeReason: string) => {
    const changes = changedFields();
    if (!changes.length) {
      toast.info("No data changes to save");
      setReasonOpen(false);
      return;
    }
    const issues = validateForm(activeForm, draft);
    const timestamp = new Date().toISOString();
    const form = formByKey[activeForm];

    setSnapshot((current) => {
      const existingQueries = new Set(
        current.queries
          .filter((query) => query.subjectId === subject.id && query.formKey === activeForm && query.status !== "Closed")
          .map((query) => query.ruleId + ":" + query.fieldId),
      );
      const newQueries: DataQuery[] = issues
        .filter((issue) => !existingQueries.has(issue.ruleId + ":" + issue.fieldId))
        .map((issue, index) => ({
          id: "Q-" + String(Date.now()).slice(-6) + "-" + (index + 1),
          subjectId: subject.id,
          formKey: activeForm,
          fieldId: issue.fieldId,
          ruleId: issue.ruleId,
          message: issue.message,
          severity: issue.severity,
          status: "Open",
          openedAt: timestamp,
          openedBy: "Automatic edit check",
        }));
      const newAudit: AuditEvent[] = changes.map((fieldId, index) => ({
        id: "AUD-" + String(Date.now()).slice(-7) + "-" + (index + 1),
        timestamp,
        subjectId: subject.id,
        formKey: activeForm,
        fieldId,
        fieldLabel: form.fields.find((field) => field.id === fieldId)?.label ?? fieldId,
        oldValue: baselineRef.current[fieldId] ?? "",
        newValue: draft[fieldId] ?? "",
        reason: changeReason,
        actor: ACTORS[role],
        role,
        source: pendingSource,
      }));
      const hasErrors = issues.some((issue) => issue.severity === "Error");
      return {
        ...current,
        records: {
          ...current.records,
          [subject.id]: {
            ...current.records[subject.id],
            [activeForm]: { ...draft },
          },
        },
        formStatuses: {
          ...current.formStatuses,
          [formStatusKey(subject.id, activeForm)]: hasErrors ? "Draft" : "Complete",
        },
        queries: [...newQueries, ...current.queries],
        audit: [...newAudit, ...current.audit],
      };
    });

    baselineRef.current = { ...draft };
    setReason("");
    setReasonOpen(false);
    setPendingSource("Manual eSource");
    if (issues.length) {
      toast.warning("Record saved with " + issues.length + " edit-check finding" + (issues.length === 1 ? "" : "s"));
    } else {
      toast.success("Source record saved and marked complete");
    }
  };

  const save = () => {
    const changes = changedFields();
    if (!changes.length) {
      toast.info("No data changes to save");
      return;
    }
    const hasPriorData = changes.some((fieldId) => !isBlank(baselineRef.current[fieldId]));
    if (hasPriorData) {
      setReasonOpen(true);
    } else {
      commitSave("Initial eSource entry.");
    }
  };

  const importFhir = () => {
    const observationId = "Observation/mock-lab-" + subject.id.toLowerCase();
    setDraft((current) => ({
      ...current,
      visit_date: "2026-09-11",
      weight_kg: 66.4,
      height_cm: 169,
      anc_x10e9_l: 2.84,
      platelets_x10e9_l: 224,
      creatinine_clearance_ml_min: 78,
      laboratory_collected_at: "2026-09-11T08:20",
      treatment_planned: true,
    }));
    setSnapshot((current) => {
      const provenance = { ...current.provenance };
      ["weight_kg", "height_cm", "anc_x10e9_l", "platelets_x10e9_l", "creatinine_clearance_ml_min", "laboratory_collected_at"].forEach((fieldId) => {
        provenance[provenanceKey(subject.id, fieldId)] = observationId + " · imported 2026-09-11T09:02:00Z";
      });
      return { ...current, provenance };
    });
    setPendingSource("FHIR Observation");
    toast.success("Six observations imported with source provenance");
  };

  const transitionStatus = (nextStatus: FormStatus) => {
    const timestamp = new Date().toISOString();
    const currentStatus = snapshot.formStatuses[formStatusKey(subject.id, activeForm)] ?? "Draft";
    setSnapshot((current) => ({
      ...current,
      formStatuses: { ...current.formStatuses, [formStatusKey(subject.id, activeForm)]: nextStatus },
      audit: [{
        id: "AUD-WF-" + String(Date.now()).slice(-7),
        timestamp,
        subjectId: subject.id,
        formKey: activeForm,
        fieldId: "__status__",
        fieldLabel: "Form workflow status",
        oldValue: currentStatus,
        newValue: nextStatus,
        reason: "Role-authorised review workflow transition.",
        actor: ACTORS[role],
        role,
        source: "System workflow",
      }, ...current.audit],
    }));
    toast.success("Form marked as " + nextStatus.toLowerCase());
  };

  const actOnQuery = (query: DataQuery) => {
    if (query.status === "Open" && (role === "Study Coordinator" || role === "Principal Investigator")) {
      setSnapshot((current) => ({
        ...current,
        queries: current.queries.map((item) => item.id === query.id
          ? { ...item, status: "Answered", response: "Source record reviewed. Data confirmed and investigator assessment documented.", respondedAt: new Date().toISOString() }
          : item),
      }));
      toast.success("Query response submitted");
    } else if (query.status === "Answered" && role === "Data Manager") {
      setSnapshot((current) => ({
        ...current,
        queries: current.queries.map((item) => item.id === query.id
          ? { ...item, status: "Closed", closedAt: new Date().toISOString() }
          : item),
      }));
      toast.success("Query closed by data manager");
    }
  };

  const resetDemo = () => {
    const fresh = createDemoSnapshot();
    setSnapshot(fresh);
    setSelectedSubjectId(fresh.subjects[0].id);
    setActiveForm("eligibility");
    setView("dashboard");
    window.localStorage.removeItem(STORAGE_KEY);
    toast.success("Synthetic demonstration data restored");
  };

  const renderView = () => {
    if (view === "dashboard") return <DashboardView snapshot={snapshot} openCapture={openCapture} openQueries={() => setView("queries")} />;
    if (view === "subjects") return <SubjectsView subjects={snapshot.subjects} queries={snapshot.queries} openCapture={openCapture} />;
    if (view === "capture") return (
      <CaptureView
        snapshot={snapshot}
        subject={subject}
        activeForm={activeForm}
        setActiveForm={setActiveForm}
        draft={draft}
        updateField={updateField}
        save={save}
        importFhir={importFhir}
        transitionStatus={transitionStatus}
        role={role}
        openSubjectList={() => setView("subjects")}
      />
    );
    if (view === "queries") return <QueriesView snapshot={snapshot} role={role} actOnQuery={actOnQuery} openCapture={openCapture} />;
    if (view === "audit") return <AuditView audit={snapshot.audit} />;
    return <ExportsView snapshot={snapshot} />;
  };

  return (
    <div className="min-h-screen bg-[#edf3f7] text-slate-900">
      <aside className={"fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[#102a43] text-white transition-transform lg:translate-x-0 " + (mobileNav ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400 text-[#102a43]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">OncoSource</p>
            <p className="text-xs text-slate-300">Clinical data workspace</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Protocol</p>
          <p className="mt-2 text-sm font-semibold">{STUDY.protocol}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{STUDY.phase} · {STUDY.indication}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setMobileNav(false);
                }}
                className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition " +
                  (active ? "bg-white text-[#102a43] shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white")}
              >
                <Icon className={"h-[18px] w-[18px] " + (active ? "text-teal-700" : "")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-200">
            <Sparkles className="h-4 w-4" /> Portfolio demonstration
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">Synthetic data only. Standards-informed, not validated for clinical use.</p>
          <button type="button" onClick={resetDemo} className="mt-3 flex items-center gap-2 text-xs font-semibold text-white hover:text-teal-200">
            <RefreshCcw className="h-3.5 w-3.5" /> Reset demonstration
          </button>
        </div>
      </aside>

      {mobileNav ? <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileNav(false)} /> : null}

      <div className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{STUDY.title}</p>
              <p className="truncate text-xs text-slate-500">{STUDY.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Demo online
            </div>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger aria-label="Switch simulated study role" className="h-10 w-[178px] border-slate-200 bg-white md:w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTORS) as Role[]).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button type="button" key={item.id} onClick={() => setView(item.id)} className={"whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold " + (view === item.id ? "bg-slate-900 text-white" : "text-slate-600")}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1580px] p-4 md:p-7">
          {renderView()}
        </main>
      </div>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for data correction</DialogTitle>
            <DialogDescription>Existing source data will change. Provide a specific reason that will be retained in the audit trail.</DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: Corrected after verification against the dated laboratory report."
            className="min-h-28"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonOpen(false)}>Cancel</Button>
            <Button disabled={reason.trim().length < 8} onClick={() => commitSave(reason.trim())} className="bg-[#0e766e] hover:bg-[#0a5f59]">
              Save with audit trail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
