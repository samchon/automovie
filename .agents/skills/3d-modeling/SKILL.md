---
name: 3d-modeling
description: Defines modeling boundaries and visual debugging. Use before modeling, changing geometry, rigs, assets, viewer behavior, materials, lighting or motion, and before claiming a visual change works.
---

# 3D Modeling

Check [project scope](../project/SKILL.md#out-of-scope) before modeling or increasing fidelity.

## Modeling

- Keep part identities, parameter meanings, units, frames and shared boundaries consistent under the [modeling contracts](../contracts/modeling.md).
- Compute and measure from the same geometry. Identify each derivative's basis and regenerate affected derivatives when it changes.
- Repair an unsound representation at its foundation instead of accumulating corrections.

## Visual debugging

If the viewer is broken, restoring it is the highest priority. Until it works again, do no work that requires visual debugging. Confirm recovery through an actual displayed model and working controls. Preserve the last valid display and protect other owners' processes.

- Inspect the actual consumer with current source and a hardware renderer. Record source, input, renderer and viewing conditions; readiness or numerical success alone proves no appearance.
- Enlarge the affected parts and inspect opposing views, assembled neighbors and use distance. Observe the states required by [Rendered Observation](../contracts/modeling.md#rendered-observation), including intermediate motion.
- Judge materials and lighting in beauty and use structural passes only for their documented quantities.
- Compare the render with the engine result to distinguish calculation from display faults. Compare before and after under matching conditions while preserving the user's working-tree changes.
- After every correction, render again and inspect it yourself. Report observed results, remaining defects and missing observations; stale, blank or unobserved output stays unverified.

Human captures and cleanup follow [Visual debugging files](../project/human.md#visual-debugging-files).
