---
name: contracts
description: Defines the @evidence checklists every maintained automovie declaration and test answers, and their evidence.config.ts wiring. Use when writing or reviewing maintained source or tests, or changing evidence selection.
---

# Contracts

Each checklist H2 is a question every selected declaration answers in its doc comment. `pnpm run evidence` checks that answers exist; review checks that they are true.

| Checklist | Asks about | Selected by |
| --- | --- | --- |
| [common.md](common.md) | Method, design, shortcuts, and documentation | Every enrolled package |
| [performance.md](performance.md) | Computation cost and resource lifetime | Every enrolled package except `interface` |
| [testing.md](testing.md) | Behavior, expectations, and cases of tests | `test` |

`packages/human` is outside evidence until it is complete (#2774).

## Answering

- Write `@evidence contracts/<file>.md#<anchor> <reason>` for each selected H2 after a blank comment line, and `@evidenceExclude` the same way for a single chapter that does not apply, never a whole file.
- Say why the approach fits and what it assumes or leaves unresolved, specific to the declaration. Do not certify results; a test answer names the cases it owns.
- Fix a defect before answering it; one outside the change's scope is stated honestly in the answer and filed as an issue. Never pass the check with a generic answer, a narrower selector, or a lower severity.

## Selection

- A package selects its exported types and functions under `src`, minus `index.ts` barrels, and keeps the native guards (`evidence/documented`, `evidence/singular`, `evidence/todo`). `pnpm exec evidence list` and `pnpm exec evidence inspect '<target>'` show what a selector reaches.
- Exclude only generated files and files the adapter cannot address (a default-export configuration, a global augmentation), which review covers.
- Renaming or removing a checklist H2 migrates every answer citing it. Keep one chapter per question and no links inside a checklist.
