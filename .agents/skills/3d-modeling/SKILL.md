---
name: 3d-modeling
description: Defines modeling rules and the visual debugging procedure, with Human-specific rules in human.md. Use before changing geometry, rigs, assets, viewer behavior, materials, lighting, motion, or anything in the human package, and before claiming a visual change works.
---

# 3D Modeling

Work on `packages/human`, its viewer and playground surfaces, or a human figure also reads [human.md](human.md).

## Modeling

- Keep part identities, parameter meanings, units, frames, and shared boundaries consistent under the [modeling checklist](../contracts/modeling.md).
- Compute and measure from the same geometry, and regenerate each derivative when its basis changes.
- Repair an unsound representation at its foundation instead of accumulating corrections.

## Visual Debugging

A broken viewer comes first: do no work that needs visual judgment until a displayed model and working controls confirm recovery, and protect other owners' processes meanwhile.

- Inspect the actual consumer with current source on a hardware renderer, recording source, input, renderer, and view. Readiness or numerical success proves no appearance.
- Enlarge the affected parts and inspect opposing views, assembled neighbors, and use distance, through the states [Rendered Observation](../contracts/modeling.md#rendered-observation) names.
- Judge materials and lighting in beauty; use structural passes only for the quantities they document.
- Compare the render with the engine result to separate calculation from display faults, and compare before and after under matching conditions.
- After every correction, render again and look yourself. Stale, blank, or unobserved output stays unverified.
