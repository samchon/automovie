# Authoring

Build a form from named parameters and formulas, so a coding agent can change it by meaning and the engine reproduces it exactly.

## Representation

Choose the representation by the form:

| Form | Representation |
| --- | --- |
| Organic or deforming, such as bodies, animals, cloth | Curve networks: sections lofted along an axis or bone chain and patched between feature curves, over a subdivision cage |
| Hard surface, such as walls, furniture, machines | Dimensioned primitives with extrusion, revolution, and boolean operations |
| Blended masses without a deformation flow, such as terrain or melted shapes | Implicit surfaces meshed once |

A vertex list is output, never the authored form.

## Rules

- A part is the smallest piece with its own identity, such as a door or a bone, with one named declaration. A group owns its members and their order and copies no member's shape, so a change reaches neighbors only through shared boundaries.
- Each parameter channel varies one named trait. A normalized offset is zero at a declared neutral with a stated positive direction, and paired features carry explicit left and right values.
- Emitted primitive counts grow with resolution parameters, not with authored features; use a parametric surface, subdivision, card, instance, or level of detail where the form allows.
- Keep one unit and one frame inside a declaration, and convert only where they meet, in one named step.
- Size surface features in physical units through the surface's metric, not in chart parameters, so they keep their size when the surface or its layout changes.
- Build a boundary between parts from one definition both sides share, so it opens no gap, overlap, or normal jump under any admitted configuration.
- Change a subdivision net's vertex count only through transitions whose extraordinary vertices have valence 3 or 5 and sit where curvature is low, because a valence-6 vertex or a cluster of poles dents the limit surface.
- Build coarse to fine: block out the whole form first, then treat each finer detail as the block-out of a smaller region, zooming in one scale at a time and fitting each scale before the next.
- Compute and measure on the geometry that is displayed, such as a subdivision limit surface rather than its cage, regenerate a derivative when its basis changes, and repair an unsound representation at its foundation instead of accumulating corrections.
