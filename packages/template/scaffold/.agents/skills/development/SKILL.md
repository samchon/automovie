---
name: development
description: Repairs and verifies this production's source and tests. Use before changing existing behavior under src or test, and before finishing any source change.
---

# Development

- Read [Repair](repair.md) when changing existing behavior or fixing a defect.
- Answer the [contracts](../contracts/SKILL.md) checklist of every exported declaration you write.
- Read [testing](../testing/SKILL.md) when the change touches what the production's tests prove.

## Checks

Finish a source change with `npm run lint` and `npm run evidence`, and with `npm test` when the production has tests. Verify a visual change under the 3D modeling skill's [Visual Debugging](../3d-modeling/visual-debugging.md); a passing check never shows that a result looks right.
