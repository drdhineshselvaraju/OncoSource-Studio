# User Requirements Specification

## Purpose

This URS defines the intended behaviour of the educational OncoSource Studio prototype. Requirements are written so that each can be traced to implementation and user acceptance testing.

## Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| URS-001 | The system shall display study-level enrolment and data-quality metrics. | Must |
| URS-002 | The system shall provide 50 reproducible synthetic participant records across three sites. | Must |
| URS-003 | The system shall render eSource forms from reusable field metadata. | Must |
| URS-004 | The system shall support text, numeric, date, date-time, controlled and Boolean fields. | Must |
| URS-005 | The system shall execute deterministic field-level and cross-field edit checks. | Must |
| URS-006 | The system shall create a query for each new unresolved edit-check finding after save. | Must |
| URS-007 | A correction to existing data shall require a reason for change. | Must |
| URS-008 | The audit history shall retain old value, new value, reason, actor, role, source and timestamp. | Must |
| URS-009 | The system shall distinguish Open, Answered and Closed query states. | Must |
| URS-010 | Query actions shall depend on the simulated user role. | Must |
| URS-011 | Forms shall support Draft, Complete, Verified, Signed and Locked states. | Must |
| URS-012 | Locked forms shall be read-only. | Must |
| URS-013 | The system shall import a mock FHIR observation set and display provenance. | Should |
| URS-014 | The system shall export a full JSON snapshot and audit CSV. | Must |
| URS-015 | The system shall export illustrative ODM XML and SDTM-oriented CSV files. | Should |
| URS-016 | The system shall persist demonstration changes in the current browser. | Should |
| URS-017 | The user shall be able to restore the original demonstration state. | Must |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-001 | The interface shall remain usable on desktop and mobile screens. |
| NFR-002 | Regular interface text shall use readable sizes and sufficient contrast. |
| NFR-003 | Interactive elements shall have accessible names and keyboard focus behaviour. |
| NFR-004 | The repository shall contain no real patient data or operational credentials. |
| NFR-005 | The application shall clearly state that it is not validated for clinical use. |
| NFR-006 | Domain logic shall be covered by automated tests. |
