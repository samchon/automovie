---
name: scaffold-prompting
description: Guides writing instructions shipped to productions.
---

# Scaffold prompting

Apply [prompting](../prompting/SKILL.md) to shipped instructions. Keep production-specific rules in the scaffold and follow the [shared skill rules](../prompting/structure.md#shared-skills) when reusing instructions.

Put section sources on one `<!-- @source ... -->` line below the heading with a blank line on either side. The installer removes the note, so keep any limits and links the production needs in the instructions.
