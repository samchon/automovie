---
name: development
description: Implements and tests production source, integrations, dependencies and commands, reusing installed packages before writing a capability. Use for code or host changes and behavioral tests; documentation owns technical writing and story owns creative bodies.
---

# Development

Read the production's current source and the [installed package APIs](reuse.md#reading-a-package) before choosing an implementation. Divide behavior into responsibilities with explicit inputs, outputs and state owners, give each module [unit tests](testing.md), then verify their composition through the actual consumer.

| Task | Read |
| --- | --- |
| Find what an installed package is for and read its API, report a defect in one, or vary and share a module | [Reuse](reuse.md) |
| Change existing behavior or fix a defect | [Repair](repair.md) |
| Build or change a subject | [Entity work](entities.md) |
| Choose behavioral checks | [Testing](testing.md) |
| Place source, tests or runtime setup, or add a subject, practice or scene | [Source layout](source-layout.md) |
| Add or change an expensive stage | [Stage caches](../production/stage-caches.md) |

Answer the [contracts](../contracts/SKILL.md) of the declarations you change, as the [development contracts](../contracts/development/SKILL.md) map them onto the source folders.

## Writing

Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md), and instructions with [prompting](../prompting/SKILL.md).

A production module's doc comment is the next agent's manual. Beyond the [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, it shows one short composition example, states the invariants it keeps, and cites what it realizes.

Creative bodies follow the production's adopted language, voice and form under [story contracts](../contracts/story/SKILL.md) in place of those writing rules, keeping fixed quotations and creative choices such as purposeful repetition, nonstandard speech and punctuation.

## Finish a change

While editing, keep the README's compile checker running as the single compile check and read errors from its output instead of rerunning a build.

Finish a source change with the README's lint, evidence and test commands, then verify the affected consumer through [review](../review/SKILL.md): a visual change on captured stills of the affected interval, and anything only playback or listening can show by asking the user.
