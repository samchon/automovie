---
name: contracts
description: Defines the @evidence checklists every exported declaration under src and every exported function of a test file under test answer. Use when writing or reviewing production source or tests.
---

# Contracts

Each H2 of [common.md](common.md) is a question every exported type and function under `src` answers in its doc comment, and each H2 of [testing.md](testing.md) one every exported function of a `test_*.ts` file under `test` answers. `npm run evidence` checks that the answers exist; review checks that they are true.

- Write `@evidence contracts/<file>.md#<anchor> <reason>` for each H2 after a blank comment line, and `@evidenceExclude` the same way for a single chapter that does not apply.
- Say why the approach fits and what it assumes or leaves unresolved, specific to the declaration; a sentence that would fit another declaration answers nothing.
- Fix a defect before answering it, and never pass the check with a generic answer.
