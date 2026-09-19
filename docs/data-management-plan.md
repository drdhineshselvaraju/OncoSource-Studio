# Data Management Plan

## Scope

This plan describes the data-management model implemented in the OncoSource Studio educational prototype.

## Roles

| Role | Demonstration responsibilities |
| --- | --- |
| Study Coordinator | Enter source data and respond to queries |
| Monitor | Review completed forms and mark them Verified |
| Principal Investigator | Review and sign forms with no blocking errors |
| Data Manager | Review answered queries, close queries and lock signed forms |

Role switching is deliberately visible for portfolio demonstration. It is not an authentication mechanism.

## Data entry and review

Forms are generated from version-controlled metadata. Controlled fields use predetermined choices. Required-field, range, chronology, conditional and protocol-threshold checks run in the browser and are repeated when a record is saved.

## Query management

New unresolved findings generate an Open query. The site may submit a response, producing Answered status. A data manager may review the response and close the query. The prototype does not automatically delete a query after data correction because a real study would preserve the query history.

## Audit history

Changes to existing saved values require a reason. Each changed field produces a separate audit event containing:

- participant and form;
- field identifier and label;
- old and new value;
- actor and role;
- timestamp;
- entry source; and
- reason for change.

The interface does not expose update or delete operations for audit events.

## External data

The Pre-dose form can receive a mock set of FHIR Observation values. Each imported field is marked with its resource identifier and import timestamp. The mock import has no network dependency.

## Data cleaning

Data cleaning is represented by deterministic edit checks, query review, form verification and investigator sign-off. Real medical coding, central-laboratory reconciliation, serious-adverse-event reconciliation and external vendor reconciliation are outside the prototype scope.

## Database lock

A signed form can be marked Locked by the simulated Data Manager. Locked forms are read-only. Production unlock authorisation, reason capture and approval are documented as a future control.

## Exports

Exports include a complete JSON snapshot, audit CSV, illustrative ODM XML, and SDTM-oriented DM, LB, AE and EX CSV files. These outputs are designed for inspection and learning. They are not submission-ready.

## Retention

Demonstration changes are stored only in browser local storage. Resetting the demonstration removes those changes. Production retention, backups, archival, record recovery and legal-hold controls are outside scope.
