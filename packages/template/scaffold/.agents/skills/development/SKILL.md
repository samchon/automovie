---
name: development
description: Implements, tests and documents production source, integrations, dependencies and commands. Use for code or host changes, behavioral tests and technical writing; creative bodies belong to screenwriting.
---

# Development

Read the production's current source and the installed package APIs before choosing an implementation. Divide behavior into cohesive responsibilities with explicit inputs, outputs, units, state ownership and failure conditions, so each part can be changed and checked independently. Reuse existing capabilities and give each module meaningful [unit tests](testing.md) against its behavioral contract, covering input boundaries, timing or retained state, and numerical error where applicable; then verify their composition through the actual consumer. Keep authored controls close to the assets, shots, and edit they control, with one owner for shared values. External acquisition produces fixed inputs before playback.

Keep the actual video or model viewer operational; restore a broken viewer before other work. Confirm its adopted scene, required subjects, view and controls through the real consumer before resuming production. A missing installed capability belongs with its reusable package owner, followed by the production's source/configuration wiring and affected-consumer verification; an unrelated demonstration or server readiness does not restore that scene. Explicit instruction sync updates guidance, not source or contracts; [campaign execution](../production/campaign.md) keeps the blocked handoff and its repair attributable.

- Read [Repair](repair.md) when changing existing behavior or fixing a defect.
- Answer the [contracts](../evidence/SKILL.md) selected for the declarations you change.
- Read [testing](testing.md) when choosing behavioral checks.
- Read [technical documentation](documentation.md) and the shared [writing rules](writing.md) for instructions, READMEs, evidence prose and doc comments; creative bodies retain their adopted form.

Finish a source change with `npm run lint`, `npm run evidence`, and `npm test`. Verify the affected consumer through [review](../review/SKILL.md), including actual renders and playback for audiovisual changes. Gather the whole round before repairing its findings.
