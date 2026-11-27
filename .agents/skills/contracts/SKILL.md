---
name: contracts
description: Defines the evidence checklists maintained declarations and tests answer.
---

# Contracts

Answer one checklist item per H2. Package declarations answer in Evidence
documents so their JSDoc stays focused on users. Tests answer in JSDoc.

`pnpm run evidence` checks coverage. Review checks truth and completeness.

| Checklist | Selected declarations |
| --- | --- |
| [Common](development/common.md) | Package declarations and tests |
| [Design](development/design.md) | Types, interfaces, aliases and classes |
| [Implementation](development/implementation.md) | Functions and methods |
| [Testing](development/testing.md) | Test functions |

## Answering

1. Read the declaration and the dependencies the item asks about.
2. Answer every fact the item asks for from what the code does.
3. Fix gaps in the code and state any that remain.

Mirror the source path under `predicate/`, replacing `src/` and using `.md`
instead of `.ts`. For example, `src/nature/AutoMovieArchetypeRock.ts` uses
`predicate/nature/AutoMovieArchetypeRock.md`. Each H1 is the declaration's address
in its defining file, such as
`# src/nature/AutoMovieArchetypeRock.ts#AutoMovieArchetypeRock.create`.

Under the declaration's H1, write
`## @evidence contracts/development/<file>.md#<anchor>` and put the reason in the
paragraph below. If the reason opens with inline code, put it on the heading
line after the target. Evidence 0.11.0 drops reason lines that start with a
backtick.

In a test's doc comment, write
`@evidence contracts/development/<file>.md#<anchor> <reason>` after a blank
comment line.

Use `@evidenceExclude` in the same format when a selected item does not apply.
Exclude individual items only. Update the declaration's Evidence document in
the same commit as the declaration.

## Selection

Package `evidence.config.ts` selects files through the published export map
and its barrels. It includes files for published owner members and types their
signatures expose. Claims select declaration kinds within those files. Test
configuration selects tests and maintained test helpers separately.

From a package, run `pnpm exec evidence list` or
`pnpm exec evidence inspect '<target>'`. An inactive claim indicates an
unmatched selector, which may lack a diagnostic. Coverage counts checklist
sections.

Never narrow a selector or lower severity to pass the check. Exclude only:

- Generated, copied, or dependency material with verified provenance.
- Files the adapter cannot address.

Review files the adapter cannot address, including default-export configs and
global augmentations.

## Editing the checklists

Adding, renaming or removing an H2 requires an authorized migration of its
Evidence references.

The common, design and implementation checklists ship through scaffold
placeholders. Productions answer in doc comments. Follow the
[shared skills](../prompting/structure.md#shared-skills) and
[scaffold distribution](../development/validation.md#scaffold-distribution)
rules.
