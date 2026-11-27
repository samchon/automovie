---
name: scaffold-prompting
description: Guides writing instructions shipped to productions.
---

# Scaffold prompting

## Writing

Apply [prompting](../prompting/SKILL.md) to shipped instructions. Keep production-specific rules in the scaffold.

## Shared skills

Follow the [shared skill rules](../prompting/structure.md#shared-skills). Use empty `$` placeholders under the scaffold's `.agents/skills`. `$documentation` reuses the repository's entire documentation skill. `development/$repair.md` reuses only `development/repair.md`.

## References

Put section sources on one `<!-- @source ... -->` line below the heading with a blank line on either side. The installer removes the note, so keep any limits and links the production needs in the instructions.
