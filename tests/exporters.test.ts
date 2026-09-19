import { describe, expect, it } from "vitest";

import { createDemoSnapshot } from "../lib/demo-data";
import { auditToCsv, domainToCsv, snapshotToOdm } from "../lib/exporters";

describe("clinical data exports", () => {
  const snapshot = createDemoSnapshot();

  it("creates one DM row for every synthetic participant", () => {
    const rows = domainToCsv(snapshot, "DM").split("\n");
    expect(rows).toHaveLength(51);
    expect(rows[0]).toContain("USUBJID");
  });

  it("produces AE and LB headers", () => {
    expect(domainToCsv(snapshot, "AE").split("\n")[0]).toContain("AETERM");
    expect(domainToCsv(snapshot, "LB").split("\n")[0]).toContain("LBTESTCD");
  });

  it("produces an ODM-shaped XML snapshot", () => {
    const xml = snapshotToOdm(snapshot);
    expect(xml).toContain('ODMVersion="1.3.2"');
    expect(xml).toContain('Study OID="STUDY.OS-NSCLC-201"');
    expect(xml).toContain('SubjectKey="OS-CHN-0001"');
  });

  it("includes required audit columns", () => {
    const csv = auditToCsv(snapshot.audit);
    expect(csv.split("\n")[0]).toContain("OLD_VALUE");
    expect(csv.split("\n")[0]).toContain("REASON");
    expect(csv.split("\n").length).toBe(snapshot.audit.length + 1);
  });
});
