---
name: contracts
description: Defines the evidence checklists maintained declarations and tests answer.
---

# Contracts

Each selected declaration answers one checklist item per H2. A package declaration answers in the package's evidence document, `evidence/<source path>.md`, under an H1 naming it as `<source path>#<accessor>`, so its doc comment stays the documentation its users read. A test function answers in its doc comment. `evidence.config.ts` selects items. `pnpm run evidence` checks coverage. Review checks truth and completeness.

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
4. In an evidence document, write `## @evidence contracts/development/<file>.md#<anchor>` under the declaration's H1, with the reason below it. In a test's doc comment, write `@evidence contracts/development/<file>.md#<anchor> <reason>` after a blank comment line.

For an item that does not apply, write `@evidenceExclude` the same way, as a heading in an evidence document and a tag in a test, never for a whole file. A change to a declaration updates its evidence document in the same commit.

## Selection

From a package run `pnpm exec evidence list` or `pnpm exec evidence inspect '<target>'`. An inactive claim indicates an unmatched selector, which can lack a diagnostic. Coverage counts checklist sections.

Never narrow a selector or lower a severity to pass the check. Exclude only:

- generated, copied, or dependency material with verified provenance;
- files the adapter cannot address.

Review files the adapter cannot address, including default-export configs and global augmentations.

## Editing the checklists

Adding, renaming or removing an H2 requires an authorized migration of its Evidence references.

The common, design and implementation checklists ship to productions through scaffold placeholders, where declarations answer in their doc comments. Keep their text true there as well as here.
