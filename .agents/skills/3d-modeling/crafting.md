# Crafting

A crafted form is code: named dimensions and formulas that the engine turns into geometry the same way every time.

Organize its parts and groups by [Modularization](modularization.md).

## Representation

Pick the representation that fits the form best, then optimize the form within it.

Prefer one where a few named values control the whole surface, the form splits into parts, and an edit stays local:

- Curve networks, sections lofted along an axis or a chain over a subdivision cage, are the default for forms that can be cut into sections, deforming and branching ones included. Read [Lofting](lofting.md) for section families and fitting.
- Code CAD, dimensioned primitives with extrusion, revolution, and boolean operations, suits rigid forms with holes and chamfers.
- Procedural rules, such as grammars or scattering, suit repeated structure.
- Implicit surfaces suit blended masses that never deform.
- Formula fields, such as displacement, add fine detail over any of these.

Never shape a form by placing vertices, triangles, or polygons by hand; vertices are only what the formulas emit.

A coding agent works under four limits, and each favors these representations over hand-placed geometry:

- It changes text by meaning, so named values let it reason about each change, while a hand-placed coordinate means nothing.
- It holds only part of a form in mind, so parts let it build the form piece by piece, while hand-placed geometry runs into thousands of coordinates.
- It cannot see the surface while it edits, so local edits keep a fix where it was made, while moving a hand-placed vertex disturbs neighbors it cannot see.
- It judges a render it did not draw, so a construction drawn beside the surface, such as sections, sketches, or a generation skeleton, traces each defect to the value that made it, while a hand-placed mesh has no construction to trace.

## Dimensions

Construct positions in each part's local frame from named dimensions and dimensionless ratios tied to shared axes, landmarks and boundaries. Express related curves as a parameterized family with shared dimensions and constraints, keeping independent measurements as independent parameters.

Keep calibration in named, sourced dimensions and coefficients; never patch individual cases with absolute vertex coordinates or duplicate a neighbor's placement constants.

Size a feature on a surface in physical units through the surface's metric. A feature sized in chart parameters changes size whenever the surface or its layout changes.

## Resolution

Let the number of emitted primitives follow the resolution setting, not the number of crafted features. Keep defining dimensions and feature locations independent of tessellation. Use a parametric surface, subdivision, cards, instances, or levels of detail where the form allows.

On a subdivision surface, place extraordinary vertices where curvature is low and keep them at valence 3 or 5 where the layout allows, because higher valences and clustered poles leave visible pinches on the limit surface.

## Order Of Work

Build the whole form first, then each finer detail as the block-out of a smaller region placed on the coarser form, so a coarse change carries its details with it.

Scale orders construction and inspection, never correction. Each [correction round](visual-debugging.md#correction-rounds) inspects the whole form and every finer region, neighbor and close-up, then fixes every cause it found in one combined change; a traced cause at a finer scale is fixed in that round, not saved for a later round or scale.

Measure on the geometry that is displayed, such as a subdivision limit surface rather than its cage. Regenerate anything derived when its basis changes, and repair an unsound representation at its foundation instead of stacking corrections on it.
