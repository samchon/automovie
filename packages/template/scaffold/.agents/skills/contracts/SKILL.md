---
name: contracts
description: Selects compact evidence obligations for production code, tests, and adopted creative scopes. Use before configuring evidence or writing or reviewing selected work.
---

# Contracts

`evidence.config.ts` owns the selected populations. By default, exported types and functions under `src` answer [common](common.md), and exported functions in `test/**/test_*.ts` answer [testing](testing.md). This small engineering baseline applies to asset-only work and videos of any length.

Adopt [narrative](narrative.md), [assets](assets.md), [delivery](delivery.md), or script-to-source relationships only for the real production units that need them, following the [contracts guide](../../../docs/guides/contracts.md). Their questions also guide review when they are not mechanically selected. Length alone does not decide evidence scope.

Each selected H2 needs a specific `@evidence contracts/<file>.md#<anchor> <reason>` answer, or `@evidenceExclude` for one inapplicable question with its reason. Source answers go in doc comments after a blank line. Fix the work before claiming compliance; name unresolved limits. `npm run evidence` checks connections, and [review](../review/SKILL.md) checks their truth.

Change scope when the production's requirements or layout change, updating selectors, links, and affected answers together. Never remove an obligation or weaken its severity to hide a defect.
