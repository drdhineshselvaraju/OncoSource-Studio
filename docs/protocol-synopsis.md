# Protocol Synopsis

## Study identification

| Item | Demonstration specification |
| --- | --- |
| Protocol | OS-NSCLC-201 |
| Title | Phase II Oncology eSource Demonstration |
| Design | Fictional, multicentre, parallel-group Phase II study |
| Indication | Non-small-cell lung cancer |
| Sites | Three synthetic research sites |
| Planned sample | 50 synthetic participants |
| Data cut | 11 September 2026 |

## Purpose

This fictional protocol exists solely to demonstrate protocol-driven clinical data collection and management. It is not a real clinical study and does not define medical treatment.

## Demonstration objectives

1. Capture informed-consent chronology and core eligibility evidence.
2. Capture pre-dose vital signs and safety laboratory results.
3. Capture study-treatment administration and dose modification.
4. Capture adverse-event chronology, severity, seriousness, causality, action and outcome.
5. Demonstrate edit checks, queries, source provenance, review, signature simulation and locking.

## Synthetic eligibility rules

- Age at consent must be 18 years or older.
- NSCLC must be recorded as histologically confirmed.
- ECOG performance status must be 0 or 1.
- Informed consent must precede screening procedures.

## Synthetic pre-dose thresholds

The following thresholds are created for software demonstration and must not be used for patient care:

- ANC: 1.5 ×10⁹/L or higher
- Platelets: 100 ×10⁹/L or higher
- Calculated creatinine clearance: 45 mL/min or higher

## Schedule of activities

| Assessment | Screening | Baseline | Each treatment cycle | End of study |
| --- | :---: | :---: | :---: | :---: |
| Consent confirmation | X |  |  |  |
| Eligibility | X | X |  |  |
| Demographics | X |  |  |  |
| Vitals |  | X | X | X |
| Safety laboratory tests |  | X | X | X |
| Treatment administration |  |  | X |  |
| Adverse events | X | X | X | X |
| Concomitant medication review | X | X | X | X |
| Investigator review |  | X | X | X |

## Data review states

Forms progress through Draft, Complete, Verified, Signed and Locked. The demonstration assigns verification to the Monitor, signing to the Principal Investigator and locking to the Data Manager.

## Safety note

Seriousness and severity are distinct concepts. A high-grade event is not automatically serious, and a serious event is not necessarily high grade. The eSource metadata and edit checks preserve this distinction.
