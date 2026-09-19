import { formDefinitions, STUDY } from "@/lib/study-config";
import type { AuditEvent, FieldValue, TrialSnapshot } from "@/lib/trial-types";

function escapeCsv(value: FieldValue | "" | undefined) {
  const text = value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeXml(value: FieldValue | "" | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function auditToCsv(audit: AuditEvent[]) {
  const header = ["AUDIT_ID", "TIMESTAMP_UTC", "SUBJECT_ID", "FORM", "FIELD", "OLD_VALUE", "NEW_VALUE", "REASON", "ACTOR", "ROLE", "SOURCE"];
  const rows = audit.map((event) => [
    event.id,
    event.timestamp,
    event.subjectId,
    event.formKey,
    event.fieldId,
    event.oldValue,
    event.newValue,
    event.reason,
    event.actor,
    event.role,
    event.source,
  ].map(escapeCsv).join(","));
  return [header.join(","), ...rows].join("\n");
}

export function domainToCsv(snapshot: TrialSnapshot, domain: "DM" | "LB" | "AE" | "EX") {
  const rows: Array<Array<FieldValue | "">> = [];
  let header: string[] = [];

  if (domain === "DM") {
    header = ["STUDYID", "DOMAIN", "USUBJID", "SITEID", "AGE", "AGEU", "SEX", "ARM", "RFICDTC"];
    snapshot.subjects.forEach((subject) => {
      const values = snapshot.records[subject.id]?.eligibility ?? {};
      rows.push([STUDY.protocol, "DM", subject.id, subject.site, values.age ?? subject.age, "YEARS", values.sex ?? subject.sex, subject.arm, values.consent_date ?? ""]);
    });
  }

  if (domain === "LB") {
    header = ["STUDYID", "DOMAIN", "USUBJID", "LBTESTCD", "LBORRES", "LBORRESU", "LBDTC"];
    snapshot.subjects.forEach((subject) => {
      const values = snapshot.records[subject.id]?.predose ?? {};
      [
        ["ANC", values.anc_x10e9_l, "10^9/L"],
        ["PLAT", values.platelets_x10e9_l, "10^9/L"],
        ["CRCL", values.creatinine_clearance_ml_min, "mL/min"],
      ].forEach(([test, result, unit]) => {
        if (result !== undefined && result !== "") rows.push([STUDY.protocol, "LB", subject.id, test as string, result as FieldValue, unit as string, values.laboratory_collected_at ?? ""]);
      });
    });
  }

  if (domain === "AE") {
    header = ["STUDYID", "DOMAIN", "USUBJID", "AETERM", "AESTDTC", "AEENDTC", "AETOXGR", "AESER", "AEREL", "AEACN", "AEOUT"];
    snapshot.subjects.forEach((subject) => {
      const values = snapshot.records[subject.id]?.adverse_event ?? {};
      if (values.ae_term) rows.push([
        STUDY.protocol,
        "AE",
        subject.id,
        values.ae_term,
        values.ae_start_date ?? "",
        values.ae_end_date ?? "",
        values.ae_grade ?? "",
        values.ae_serious === true ? "Y" : "N",
        values.causality ?? "",
        values.action_taken ?? "",
        values.outcome ?? "",
      ]);
    });
  }

  if (domain === "EX") {
    header = ["STUDYID", "DOMAIN", "USUBJID", "EXTRT", "EXDOSE", "EXDOSU", "EXSTDTC", "EXENDTC", "EXADJ"];
    snapshot.subjects.forEach((subject) => {
      const values = snapshot.records[subject.id]?.treatment ?? {};
      if (values.administered === true) rows.push([
        STUDY.protocol,
        "EX",
        subject.id,
        "DEMONSTRATION STUDY TREATMENT",
        values.actual_dose_mg ?? "",
        "mg",
        values.dose_start ?? "",
        values.dose_end ?? "",
        values.dose_modified === true ? "Y" : "N",
      ]);
    });
  }

  return [header.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
}

export function snapshotToOdm(snapshot: TrialSnapshot) {
  const itemDefs = formDefinitions.flatMap((form) => form.fields.map((field) =>
    `        <ItemDef OID="IT.${form.key}.${field.id}" Name="${escapeXml(field.label)}" DataType="${field.type === "number" ? "float" : field.type === "date" ? "date" : "text"}"${field.unit ? ` Units="${escapeXml(field.unit)}"` : ""} />`,
  )).join("\n");

  const clinicalData = snapshot.subjects.map((subject) => {
    const forms = formDefinitions.map((form) => {
      const values = snapshot.records[subject.id]?.[form.key] ?? {};
      const items = form.fields
        .filter((field) => values[field.id] !== undefined && values[field.id] !== "")
        .map((field) => `              <ItemData ItemOID="IT.${form.key}.${field.id}" Value="${escapeXml(values[field.id])}" />`)
        .join("\n");
      return `          <FormData FormOID="FORM.${form.key}">\n${items}\n          </FormData>`;
    }).join("\n");
    return `      <SubjectData SubjectKey="${escapeXml(subject.id)}">\n        <StudyEventData StudyEventOID="VISIT.CURRENT">\n${forms}\n        </StudyEventData>\n      </SubjectData>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3" ODMVersion="1.3.2" FileType="Snapshot" FileOID="${STUDY.protocol}.DEMO" CreationDateTime="2026-09-11T12:00:00Z">
  <Study OID="STUDY.${STUDY.protocol}">
    <GlobalVariables>
      <StudyName>${escapeXml(STUDY.title)}</StudyName>
      <StudyDescription>Standards-informed educational eSource demonstration using synthetic data.</StudyDescription>
      <ProtocolName>${STUDY.protocol}</ProtocolName>
    </GlobalVariables>
    <MetaDataVersion OID="MDV.1" Name="Demonstration metadata v1.0">
${itemDefs}
    </MetaDataVersion>
  </Study>
  <ClinicalData StudyOID="STUDY.${STUDY.protocol}" MetaDataVersionOID="MDV.1">
${clinicalData}
  </ClinicalData>
</ODM>`;
}

export function exportManifest(snapshot: TrialSnapshot) {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    disclaimer: "Educational prototype. Not validated or intended for clinical use or regulatory submission.",
    study: STUDY,
    subjectCount: snapshot.subjects.length,
    queryCount: snapshot.queries.length,
    auditEventCount: snapshot.audit.length,
    snapshot,
  }, null, 2);
}
