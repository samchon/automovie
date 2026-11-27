---
name: scaffold-prompting
description: Guides writing instructions shipped to productions.
---

# Scaffold prompting

## Writing

Apply [prompting](../prompting/SKILL.md) to shipped instructions. Keep production-specific rules in the scaffold.

Follow [scaffold distribution](../development/validation.md#scaffold-distribution) when changing what the installer ships.

## Shared skills

Follow the [shared skill rules](../prompting/structure.md#shared-skills). Use empty `$` placeholders under the scaffold's `.agents/skills`. `$documentation` reuses the repository's entire documentation skill. `development/$repair.md` reuses only `development/repair.md`.

A standalone `## ${Continuing}` in scaffold skill Markdown inserts the matching H2 from the root file at the same path. It copies the heading and body through the next H1 or H2 or the end of the file. Headings and markers inside code fences are ignored.

## References

Put section sources on one `<!-- @reference ... -->` line below the heading with a blank line on either side. The installer removes the note, so keep any limits and links the production needs in the instructions.
