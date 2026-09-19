# Contributing

Contributions should preserve the project as a synthetic educational demonstration.

## Before opening a pull request

1. Do not add patient, participant, hospital or sponsor data from a real study.
2. Give every validation rule a stable identifier and document it in the edit-check specification.
3. Update the data dictionary when fields or controlled choices change.
4. Update the traceability matrix when a requirement or implementation changes.
5. Add or update an automated test for domain-logic changes.
6. Run the test, type-check and production-build commands in the README.

## Clinical content

Protocol thresholds are fictional software-test values. Changes must remain clearly labelled as educational and must not be presented as clinical guidance.

## Commit style

Use concise, action-oriented commit messages, such as:

- Add conditional SAE seriousness check
- Preserve FHIR provenance on imported laboratory values
- Document form-lock workflow limitation
