---
name: contracts
description: Defines the evidence checklists maintained declarations and tests answer.
---

# Contracts

Each checklist H2 names one item, which every selected declaration answers in its doc comment as the item's respondent. A package's `evidence.config.ts` selects the checklists; `pnpm run evidence` checks that answers exist, and review checks that they are true and complete.

| Checklist | Answered by |
| --- | --- |
| [development/common.md](development/common.md) | Every exported declaration, tests included |
| [development/design.md](development/design.md) | Each exported type, interface, type alias and class |
| [development/implementation.md](development/implementation.md) | Each exported function and class method |
| [development/testing.md](development/testing.md) | Each exported test function |

## Answering

Answer each item in four steps:

1. Read the declaration and everything its item asks about, such as its callers and tests.
2. Answer every fact the item asks for, from what the code does.
3. Fix the code where it falls short of the item, and state any gap that remains instead of claiming it is met.
4. Write `@evidence contracts/development/<file>.md#<anchor> <reason>` after a blank comment line.

A partial, generic or untrue answer is a defect.

For an item that does not apply, write `@evidenceExclude` the same way, never for a whole file.

## Selection

From a package, `pnpm exec evidence list` and `pnpm exec evidence inspect '<target>'` show what a selector reaches. `Claims: 3/4 active` means a selector matched nothing, without a diagnostic, and `Coverage` counts checklist sections, not declarations.

Never narrow a selector or lower a severity to pass the check. Exclude only:

- generated, copied, or dependency material with verified provenance;
- files the adapter cannot address.

The adapter cannot address a file such as a default-export configuration or a global augmentation, and review covers those files.

## Editing the checklists

Tens of thousands of tags cite the checklists' paths and H2s, so adding, renaming, or removing an H2 needs an authorized migration of every answer.
