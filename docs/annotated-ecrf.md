# Annotated eCRF Specification

## General conventions

- Participant IDs are pseudonymous synthetic identifiers.
- Dates use ISO 8601 format.
- Date-time values are captured without assuming a local regulatory time zone.
- Required fields are identified in metadata.
- Controlled responses are used when practical.
- Collection variables are mapped for educational CDASH and SDTM traceability.

## Consent and eligibility

| Field | Type | Required | Collection variable | Target domain | Design note |
| --- | --- | :---: | --- | --- | --- |
| Informed consent date | Date | Yes | RFICDTC | DM | Must precede screening |
| Screening assessment date | Date | Yes | IEDTC | IE | Cross-date validation |
| Age at consent | Number | Yes | AGE | DM | Minimum 18 years |
| Sex at birth | Controlled | Yes | SEX | DM | Female or Male in demo |
| NSCLC histologically confirmed | Boolean | Yes | IETESTCD | IE | Required eligibility evidence |
| ECOG performance status | Controlled | Yes | EGORRES | QS | Protocol permits 0 or 1 |
| Eligibility assessment note | Text | No | IECOM | IE | Source clarification |

## Pre-dose assessment

| Field | Type | Unit | Collection variable | Target domain | Design note |
| --- | --- | --- | --- | --- | --- |
| Cycle visit date | Date |  | SVSTDTC | SV | Supports visit chronology |
| Weight | Number | kg | VSORRES | VS | Range check 25–180 |
| Height | Number | cm | VSORRES | VS | Range check 120–220 |
| Absolute neutrophil count | Number | ×10⁹/L | LBORRES | LB | Protocol threshold check |
| Platelet count | Number | ×10⁹/L | LBORRES | LB | Protocol threshold check |
| Calculated creatinine clearance | Number | mL/min | LBSTRESN | LB | Blocking threshold check |
| Laboratory collection time | Date-time |  | LBDTC | LB | Source chronology |
| Treatment planned after review | Boolean |  | EXYN | EX | Investigator decision |

## Study treatment administration

| Field | Type | Unit | Collection variable | Target domain |
| --- | --- | --- | --- | --- |
| Treatment administered | Boolean |  | EXYN | EX |
| Protocol dose | Number | mg/m² | EXDOSE | EX |
| Actual dose administered | Number | mg | EXDOSE | EX |
| Administration start | Date-time |  | EXSTDTC | EX |
| Administration end | Date-time |  | EXENDTC | EX |
| Dose modified | Boolean |  | EXADJ | EX |
| Modification reason | Text |  | EXADJRS | EX |

## Adverse event

| Field | Type | Collection variable | Target domain | Design note |
| --- | --- | --- | --- | --- |
| Adverse event term | Text | AETERM | AE | Investigator-reported term |
| Start date | Date | AESTDTC | AE | Required when event entered |
| End date | Date | AEENDTC | AE | Cannot precede start |
| CTCAE grade | Controlled | AETOXGR | AE | Severity only |
| Serious adverse event | Boolean | AESER | AE | Seriousness only |
| Seriousness criterion | Controlled | AESCONG and related qualifiers | AE | Required if serious |
| Relationship to treatment | Controlled | AEREL | AE | Investigator assessment |
| Action taken | Controlled | AEACN | AE | Treatment action |
| Outcome | Controlled | AEOUT | AE | Event status |
