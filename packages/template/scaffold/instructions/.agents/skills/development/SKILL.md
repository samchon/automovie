---
name: development
description: Implements and tests production source, integrations, dependencies and commands, reusing installed packages before writing a capability. Use for code or host changes and behavioral tests; documentation owns technical writing and story owns creative bodies.
---

# Development

Read the existing source and relevant [installed APIs](../automovie/SKILL.md#reading-a-package) before implementing a capability.

Divide the production's own behavior by responsibility, with explicit inputs, outputs and state owners. Test what each module owns under [testing](testing.md), then verify the composition through its actual consumer.

| Read | To |
| --- | --- |
| [AutoMovie packages](../automovie/SKILL.md) | Find the installed package for a need and read its API |
| [Repair](repair.md) | Change existing behavior or fix a defect |
| [Entity work](entities.md) | Build or change a subject |
| [Testing](testing.md) | Choose behavioral checks |
| [Source layout](source-layout.md) | Place source, tests or runtime setup, or add a subject, practice or scene |
| [Modules](source-layout.md#modules) | Vary or share a module |
| [Stage caches](../production/stage-caches.md) | Add or change an expensive stage |

Every declaration you change answers its [development contracts](../contracts/development/SKILL.md) in its doc comment.

## Writing

Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md), and instructions with [prompting](../prompting/SKILL.md).

A production module's doc comment is the next agent's manual. Beyond the [meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, it shows one short composition example, states the invariants it keeps, and cites what it realizes.

## Finishing a change

While editing, keep the README's compile checker running as the single compile check, and read errors from its output instead of rerunning a build.

Finish with the README's lint, evidence and test commands, then verify the affected consumer through [review](../review/SKILL.md): a visual change on captured stills of the affected interval, and what stills cannot show as the production's `AGENTS.md` sets under what you can observe.
