---
name: development
description: Implements and tests production source, integrations, dependencies and commands. Use for code or host changes and behavioral tests; documentation owns technical writing and story owns creative bodies.
---

# Development

Read the production's current source and the installed package APIs before choosing an implementation. Divide behavior into responsibilities with explicit inputs, outputs and state owners, give each module [unit tests](testing.md), then verify their composition through the actual consumer. Search the installed packages before writing a capability: a behavior several productions use is extended in its package and imported, because a second copy diverges at its first repair. A missing capability is repaired at its package owner, and [campaign execution](../production/campaign.md) keeps that handoff attributable.

- Read [Repair](repair.md) when changing existing behavior or fixing a defect.
- Answer the [contracts](../contracts/SKILL.md) of the declarations you change: design for types, implementation for functions, and entities, behaviors or composition for the declarations under `src/entities/`, `src/laws/`, `src/interactions/`, `src/consequences/` or `src/composition/`.
- Read [testing](testing.md) when choosing behavioral checks.
- Read [stage caches](../production/stages.md) when adding or changing an expensive stage.
- Read [source layout](layout.md) when placing source, tests or runtime setup, or adding a subject, practice or scene.
- Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md). A production module's doc comment is the next agent's manual: beyond the [Meaningful documentation](../contracts/development/common.md#meaningful-documentation) item, it shows one short composition example, states the invariants it keeps, and cites what it realizes. Write instructions with [prompting](../prompting/SKILL.md). Creative bodies follow the production's adopted language, voice and form under [story contracts](../contracts/story/SKILL.md) in place of those writing rules, keeping fixed quotations and creative choices such as purposeful repetition, nonstandard speech and punctuation.

While editing, keep one `npm run lint -- --watch` running and read compile errors from it instead of rerunning a build. Finish a source change with `npm run lint`, `npm run evidence` and `npm test`, then verify the affected consumer through [review](../review/SKILL.md), including actual renders and playback for audiovisual changes.
