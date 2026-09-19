# User Acceptance Test Specification

Prepared: 11 September 2026

Execution status: Ready for independent portfolio review

Dataset: reproducible synthetic demonstration data

| Test ID | Scenario | Expected result | Implementation status |
| --- | --- | --- | :---: |
| UAT-001 | Open the application | Study overview displays participant, completeness, query and risk metrics | Implemented |
| UAT-002 | Open Participants | Fifty synthetic participant records are available; table supports search and status filter | Implemented |
| UAT-003 | Open a participant casebook | Four protocol-driven form tabs and current workflow status are displayed | Implemented |
| UAT-004 | Change a numeric, controlled and Boolean value | Each field accepts the expected data type and preserves its label and metadata annotation | Implemented |
| UAT-005 | Enter ANC below 1.5 and save | LAB-001 warning appears and a new Open query is created if one is not already active | Implemented |
| UAT-006 | Correct an existing value and save | Reason-for-change is mandatory; saved audit event includes old and new values | Implemented |
| UAT-007 | Answer and close a query | Coordinator or investigator can answer; Data Manager can close an answered query | Implemented |
| UAT-008 | Change simulated role and review a form | Monitor can verify, investigator can sign and Data Manager can lock at the appropriate state | Implemented |
| UAT-009 | Open a locked form | Inputs and save action are disabled | Implemented |
| UAT-010 | Select Import mock FHIR on Pre-dose | Six values populate and show source-provenance badges | Implemented |
| UAT-011 | Generate each export | Browser downloads JSON, XML and CSV content without sending data externally | Implemented |
| UAT-012 | Refresh after a saved change | Saved demonstration state reloads from local browser storage | Implemented |
| UAT-013 | Select Reset demonstration | Original reproducible dataset and default view are restored | Implemented |

## Deviations and limitations

- Independent UAT execution should be completed if the prototype is used in a formal portfolio assessment.
- Electronic signatures are simulated workflow states, not legally binding signatures.
- Role switching is an interview demonstration mechanism, not identity or access control.
- ODM and SDTM-oriented exports are illustrative and have not been certified.
- Browser-local storage is not a production clinical-data repository.
