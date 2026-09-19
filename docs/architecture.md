# Architecture and Data Flow

## Application layers

| Layer | Responsibility |
| --- | --- |
| Study metadata | Defines reusable forms, fields, controlled choices, units and collection mappings |
| Synthetic record generator | Creates a reproducible 50-participant, three-site demonstration |
| eSource workspace | Captures values, renders validation messages and displays provenance |
| Edit-check engine | Applies required, range, chronology, conditional and protocol rules |
| Query workflow | Preserves Open, Answered and Closed discrepancy states |
| Audit history | Appends attributable old-value and new-value events |
| Review workflow | Moves records through Draft, Complete, Verified, Signed and Locked |
| Export layer | Generates JSON, CSV and illustrative ODM content |

## Collection lifecycle

Draft becomes Complete after a save with no blocking errors. A Monitor may move Complete to Verified. A Principal Investigator may move Complete or Verified to Signed when no blocking errors remain. A Data Manager may move Signed to Locked.

## Data flow

Version-controlled study metadata and synthetic records feed dynamic eSource forms. A mock FHIR Bundle may pre-populate selected fields with provenance. Saved data run through deterministic edit checks, which can create queries. Committed values generate audit events. Current source records, queries, provenance and audit history feed the oversight views and downloadable exports.

## Main design boundaries

- The user interface and domain logic execute in the browser.
- Study configuration, edit checks and seed data are version-controlled source files.
- Browser local storage preserves demonstration changes on one device.
- Exports are generated locally and do not transmit data to an external service.
- A production system would require durable server storage, controlled authentication, authorisation, validation evidence, security monitoring, backup and operational procedures.
