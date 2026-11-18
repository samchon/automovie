---
name: development
description: Implements and tests production source.
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
| [Modules](modules.md) | Join entities, scenes and films, or vary or share a module |
| [Stage caches](../production/stage-caches.md) | Add or change an expensive stage |

Every declaration you change answers its [development contracts](../contracts/development/SKILL.md) in its doc comment.

## Writing

Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md), and instructions with [prompting](../prompting/SKILL.md).

Document invariants and the material the module realizes. Give one short composition example under [Meaningful documentation](../contracts/development/common.md#meaningful-documentation).

## Finishing a change

Read compile errors from the README's single running checker.

Finish with the README's lint, evidence and test commands, then verify the affected consumer through [review](../review/SKILL.md): a visual change on captured stills of the affected interval, and what stills cannot show by asking the user.
