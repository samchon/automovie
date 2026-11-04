---
name: development
description: Implements and tests production source, integrations, dependencies and commands. Use for code or host changes and behavioral tests; documentation owns technical writing and screenwriting owns creative bodies.
---

# Development

Read the production's current source and the installed package APIs before choosing an implementation. Divide behavior into cohesive responsibilities with explicit inputs, outputs, units, state ownership and failure conditions, so each part can be changed and checked independently. Reuse existing capabilities and give each module meaningful [unit tests](testing.md) against its behavioral contract, covering input boundaries, timing or retained state, and numerical error where applicable; then verify their composition through the actual consumer. Keep authored controls close to the assets, shots, and edit they control, with one owner for shared values. External acquisition produces fixed inputs before playback.

A missing installed capability belongs with its package owner, and [campaign execution](../production/campaign.md) keeps the blocked handoff and its repair attributable. Explicit instruction sync updates guidance, not source or contracts.

- Read [Repair](repair.md) when changing existing behavior or fixing a defect.
- Answer the [contracts](../evidence/SKILL.md) selected for the declarations you change.
- Read [testing](testing.md) when choosing behavioral checks.
- Write READMEs, evidence prose and doc comments with [documentation](../documentation/SKILL.md), answer the [Authoring interface](../contracts/common.md#authoring-interface) question in a public declaration's comment, and write instructions with [prompting](../prompting/SKILL.md). Creative bodies follow the production's adopted language, voice and form under [story contracts](../contracts/story/index.md) in place of those writing rules, keeping fixed quotations and creative choices such as purposeful repetition, nonstandard speech and punctuation.

Finish a source change with `npm run lint`, `npm run evidence`, and `npm test`. Verify the affected consumer through [review](../review/SKILL.md), including actual renders and playback for audiovisual changes. Gather the whole round before repairing its findings.
