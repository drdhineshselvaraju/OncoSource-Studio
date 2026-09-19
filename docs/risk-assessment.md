# Prototype Risk Assessment

| Risk | Potential effect | Implemented control | Residual limitation |
| --- | --- | --- | --- |
| Real patient data entered into demo | Privacy breach | Persistent synthetic-data warning and SECURITY guidance | Browser cannot technically prevent users typing identifiers |
| Invalid chronology | Inconsistent source data | Consent, treatment and AE date checks | Not all protocol date relationships are modelled |
| Missing safety data | Incomplete AE or dosing record | Required and conditional edit checks | No external safety-system reconciliation |
| Severity confused with seriousness | Incorrect safety classification | Separate fields, help text and independent validation | Investigator clinical assessment remains outside app |
| Unattributable correction | Loss of data integrity | Mandatory reason and field-level audit event | Local storage is not tamper-resistant |
| Unauthorised workflow action | Inappropriate verification, signature or lock | Role-dependent action guards | Visible role switching is not authentication |
| Source provenance lost | Unverifiable imported value | Per-field FHIR resource identifier and import timestamp | No cryptographic source verification |
| Export interpreted as submission-ready | Regulatory misuse | Labels and README disclaimers | Recipient must preserve the disclaimer |
| Browser data loss | Demonstration state unavailable | Reproducible seed data and reset function | No server backup or disaster recovery |
| Edit check defect | Missed or incorrect query | Stable rule IDs and automated domain tests | Formal independent validation is outside scope |
