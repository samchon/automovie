---
name: 3d-modeling
description: Defines modeling rules and the visual debugging procedure. Use before changing geometry, rigs, assets, viewer behavior, materials, lighting, or motion, and before claiming a visual change works.
---

# 3D Modeling

## Modeling

- A part is the smallest piece with its own identity, such as a door or a bone, with one named declaration. A group owns its members and their order and copies no member's shape, so a change reaches neighbors only through shared boundaries.
- Each parameter channel varies one named trait. A normalized offset is zero at a declared neutral with a stated positive direction, and paired features carry explicit left and right values.
- Emitted primitive counts grow with resolution parameters, not with authored features; use a parametric surface, subdivision, card, instance, or level of detail where the form allows.
- Keep one unit and one frame inside a declaration, and convert only where they meet, in one named step.
- Build a boundary between parts from one definition both sides share, so it opens no gap, overlap, or normal jump under any admitted configuration.
- Compute and measure from the same geometry, regenerate a derivative when its basis changes, and repair an unsound representation at its foundation instead of accumulating corrections.

## Visual Debugging

A broken viewer comes first: do no work that needs visual judgment until a displayed model and working controls confirm recovery, and protect other owners' processes meanwhile.

- Inspect the actual consumer with current source on a hardware renderer, recording source, input, renderer, and view. Readiness or numerical success proves no appearance.
- Inspect from every direction, back quarters and high and low obliques included, and aim a free camera at each defect, because front and side alone hide oblique sections and junctions. Enlarge the affected parts and inspect assembled neighbors and use distance, at rest, intermediate states, supported extremes, return, and shape-motion combinations.
- Never judge a constructed surface without its construction net, its sections, guide curves and control cage: every set of views, whole sweeps and each defect's close-up alike, shows the same cameras as surface, net overlaid on the surface, and net alone. The surface shows the symptom; the net shows the curve or section that causes it.
- Judge materials and lighting in beauty; use structural passes only for the quantities they document.
- Compare the render with the engine result to separate calculation from display faults, and compare before and after under matching conditions.
- After every correction, render again and look yourself. Stale, blank, or unobserved output stays unverified.
