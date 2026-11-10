---
name: contracts
description: Defines the @evidence checklists every maintained automovie declaration and test answers, and their evidence.config.ts wiring. Use when writing or reviewing maintained source or tests, or changing Evidence selection.
---

# Contracts

Each checklist H2 is a question that every selected declaration answers in its doc comment. A package's `evidence.config.ts` selects the checklists; `pnpm run evidence` checks that answers exist, and [review](../review/SKILL.md) checks that they are true and complete.

| Checklist | Answered by | Asks about |
| --- | --- | --- |
| [development/common.md](development/common.md) | Every exported declaration, tests included | Documentation of purpose, members, calculations, and test scenarios |
| [development/design.md](development/design.md) | Each exported type, interface, type alias and class | Representation, owned surface, and design shortcuts |
| [development/implementation.md](development/implementation.md) | Each exported function and class method | Method, structure, implementation shortcuts, computation cost, reuse, and resource lifetime |
| [development/testing.md](development/testing.md) | Each exported test function | Behavior, expectations, cases, and execution layer |

## Answering

1. Before writing, read the declaration and everything its H2 asks about, such as its callees, callers, and tests.
2. Answer every fact the H2 asks for, from what the code actually does. A partial, generic, or untrue answer is a defect, not a pass.
3. If the code falls short of the question, fix the code, and state any gap that remains instead of claiming the requirement is met.
4. Write `@evidence contracts/development/<file>.md#<anchor> <reason>` after a blank comment line, and `@evidenceExclude` the same way only for an item that does not apply, never for a whole file.

## Selection

From a package, `pnpm exec evidence list` and `pnpm exec evidence inspect '<target>'` show what a selector reaches. `Claims: 3/4 active` means a selector matched nothing, without a diagnostic, and `Coverage` counts checklist sections, not declarations.

Never narrow a selector or lower a severity to pass the check. Exclude only:

- generated, copied, or dependency material with verified provenance;
- files the adapter cannot address, such as a default-export configuration or a global augmentation, which [review](../review/SKILL.md) covers.

## Editing the checklists

Tens of thousands of tags cite their paths and H2s, so adding, renaming, or removing an H2 needs an authorized migration of every answer. Keep one H2 per question.
