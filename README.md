# OncoSource Studio

A metadata-driven, standards-informed eSource and EDC portfolio prototype for a synthetic Phase II oncology study.

OncoSource Studio demonstrates how a clinical study protocol can be translated into structured eSource forms, deterministic edit checks, query workflows, attributable audit history, role-based review and standards-oriented exports. The application is intentionally built with synthetic data and is suitable for a clinical data management, clinical database design, eSource, EDC or clinical systems portfolio.

> Educational portfolio prototype only. It is not validated, is not intended for clinical use and must not be represented as compliant with 21 CFR Part 11 or any other regulation.

## Live workflow

The demonstration opens directly on study oversight. A reviewer can:

1. inspect enrolment and data-quality indicators across three synthetic sites;
2. open any of 50 fictional participant casebooks;
3. capture Screening, Pre-dose, Treatment and Safety data from metadata-driven forms;
4. import a mock FHIR Observation set with source provenance;
5. trigger field-level and cross-field edit checks;
6. save corrections with a mandatory reason and append-only audit event;
7. respond to or close queries by switching the simulated study role;
8. move forms through Complete, Verified, Signed and Locked states; and
9. export JSON, audit CSV, illustrative CDISC ODM XML and SDTM-oriented CSV files.

## Why this project matters

- Protocol-to-eCRF translation
- CDASH-oriented collection metadata
- Explicit units, controlled responses and field help
- Deterministic validation rules with stable rule identifiers
- Separation of adverse-event severity and seriousness
- Data-query lifecycle and source-data provenance
- Attributable changes with old value, new value, reason, actor, role and timestamp
- Review and lock workflow
- Collection-to-tabulation mapping
- User requirements, traceability and a ready-to-run UAT specification

## Technology

- Next.js / Vinext, React and TypeScript
- Tailwind CSS and accessible Shadcn interface primitives
- Browser-local persistence for a self-contained demonstration
- Vitest for domain-logic tests
- GitHub Actions continuous integration

The deployed demonstration uses device-local browser storage. A production implementation would replace this with a validated server-side persistence layer, controlled identity, security monitoring, backup and disaster-recovery procedures.

## Quick start

Requirements: Node.js 22.13 or newer and pnpm.

    pnpm install
    pnpm dev

## Quality checks

    pnpm test
    pnpm lint
    pnpm exec tsc --noEmit
    pnpm build

## Five-minute interview demonstration

1. From **Study overview**, explain the data-quality signals and select **Open active casebook**.
2. Open **Pre-dose**, change the ANC to 1.2, and show the protocol-threshold warning.
3. Select **Import mock FHIR** and point out the provenance badges beside imported data.
4. Save the corrected values and enter a reason for change.
5. Open **Audit trail** to show the old value, new value, actor, role, source and reason.
6. Open **Data queries**, answer an open query as Study Coordinator, switch to Data Manager and close an answered query.
7. Open **Data exports** and explain collection-to-tabulation traceability.

## Repository map

    app/                       Application entry, metadata and visual theme
    components/                Working eSource interface
    lib/study-config.ts        Metadata-driven eCRF definitions
    lib/validation.ts          Deterministic edit-check engine
    lib/demo-data.ts           Reproducible synthetic study records
    lib/exporters.ts           JSON, CSV and illustrative ODM export logic
    docs/                      Protocol, aCRF, DMP, URS, traceability and UAT
    synthetic-data/            Mock FHIR Bundle used for interoperability demo
    tests/                     Validation and export tests

## Standards references

Design choices were informed by the following primary references:

- [ICH E6(R3) Good Clinical Practice, final version adopted 6 January 2025](https://database.ich.org/sites/default/files/ICH_E6%28R3%29_Step4_FinalGuideline_2025_0106.pdf)
- [FDA Electronic Source Data in Clinical Investigations guidance](https://www.fda.gov/media/85183/download)
- [21 CFR Part 11, Electronic Records and Electronic Signatures](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11)
- [CDISC CDASH](https://www.cdisc.org/standards/foundational/cdash), [SDTM](https://www.cdisc.org/standards/foundational/sdtm) and [ODM](https://www.cdisc.org/standards/data-exchange/odm)
- [HL7 FHIR R4 Provenance](https://hl7.org/fhir/R4/provenance.html)

The repository uses standards terminology for educational traceability. Its exports are illustrative and have not been certified by CDISC or validated for a regulatory submission.

## Privacy and security

- All participant identifiers, sites, dates, values and names are synthetic.
- No real patient, hospital or trial data are included.
- The demonstration stores changes only in the current browser.
- No credentials, secrets or external clinical-system endpoints are required.

See [SECURITY.md](SECURITY.md) for safe-use boundaries.

## Documentation

- [Protocol synopsis](docs/protocol-synopsis.md)
- [Annotated eCRF specification](docs/annotated-ecrf.md)
- [Data dictionary](docs/data-dictionary.csv)
- [Edit-check specification](docs/edit-check-specification.csv)
- [User requirements specification](docs/user-requirements-specification.md)
- [Data management plan](docs/data-management-plan.md)
- [Requirements traceability matrix](docs/traceability-matrix.csv)
- [UAT specification](docs/uat-report.md)
- [Architecture and data flow](docs/architecture.md)
- [Prototype risk assessment](docs/risk-assessment.md)

## Licence

MIT. Standards and terminology referenced in the project remain the property of their respective organisations.
