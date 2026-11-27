---
name: scaffold-prompting
description: Guides writing instructions shipped to productions.
---

# Scaffold prompting

## Writing

Apply [prompting](../prompting/SKILL.md) to shipped instructions. Keep production-specific rules in the scaffold.

## Shared skills

Follow the [shared skill rules](../prompting/structure.md#shared-skills). Use empty `$` placeholders under the scaffold's `.agents/skills`. `$documentation` reuses the repository's entire documentation skill. `development/$repair.md` reuses only `development/repair.md`.

In scaffold skill Markdown, a standalone `## ${Continuing}` heading transcludes
that complete section from the root Markdown file at the same repository-relative
path. It preserves the source heading and body through the next real H1/H2 or
end of file; marker/headings inside fenced code are ignored. Whole-file `$name`
placeholders keep their existing behavior.

## References

Put section sources on one `<!-- @reference ... -->` line below the heading with a blank line on either side. The installer removes the note, so keep any limits and links the production needs in the instructions.
