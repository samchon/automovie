---
name: contracts
description: Defines the evidence checklists maintained declarations and tests answer.
---

# Contracts

Each selected declaration answers one checklist item per H2 in its doc comment. `evidence.config.ts` selects items. `pnpm run evidence` checks coverage. Review checks truth and completeness.

| Checklist | Answered by |
| --- | --- |
| [development/common.md](development/common.md) | Every exported declaration, tests included |
| [development/design.md](development/design.md) | Each exported type, interface, type alias and class |
| [development/implementation.md](development/implementation.md) | Each exported function and class method |
| [development/testing.md](development/testing.md) | Each exported test function |

## Answering

Answer each item from the code:

1. Read the declaration and the dependencies the item asks about.
2. Answer every fact the item asks for, from what the code does.
3. Fix the code where it falls short of the item, and state any gap that remains instead of claiming it is met.
4. Write `@evidence contracts/development/<file>.md#<anchor> <reason>` after a blank comment line.

For an item that does not apply, write `@evidenceExclude` the same way, never for a whole file.

## Selection

From a package run `pnpm exec evidence list` or `pnpm exec evidence inspect '<target>'`. An inactive claim indicates an unmatched selector, which can lack a diagnostic. Coverage counts checklist sections.

Never narrow a selector or lower a severity to pass the check. Exclude only:

- generated, copied, or dependency material with verified provenance;
- files the adapter cannot address.

Review files the adapter cannot address, including default-export configs and global augmentations.

## Editing the checklists

Adding, renaming or removing an H2 requires an authorized migration of its Evidence references.
