# Crafting

A crafted form is code: named dimensions and formulas that the engine turns into geometry the same way every time.

## Representation

Pick the representation that fits the form best, then optimize the form within it.

Prefer one where a few named values control the whole surface, the form splits into parts, and an edit stays local:

- Curve networks, sections lofted along an axis or a chain over a subdivision cage, are the default for forms that can be cut into sections, deforming and branching ones included.
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

## Parts And Groups

Split an asset into fine parts, each one named declaration.

Group the parts as the object is assembled and moves. A group is a node with children: its frame is the pivot of its subtree and its rotation limit is the subtree's range of motion, so put each group's frame on the real axis, such as a hinge. Link across branches with a driver, never a second parent.

A group never copies a member's shape. Neighbors meet only at a boundary built from one shared definition, so no state of the asset opens a gap, overlap, or normal jump.

## Dimensions

Keep one unit and one frame inside a declaration, and convert only where declarations meet, in one named step.

Size a feature on a surface in physical units through the surface's metric. A feature sized in chart parameters changes size whenever the surface or its layout changes.

## Resolution

Let the number of emitted primitives follow the resolution setting, not the number of crafted features. Use a parametric surface, subdivision, cards, instances, or levels of detail where the form allows.

On a subdivision surface, place extraordinary vertices where curvature is low and keep them at valence 3 or 5 where the layout allows, because higher valences and clustered poles leave visible pinches on the limit surface.

## Order Of Work

Block out the whole form first. Then treat each finer detail as the block-out of a smaller region, and fit each scale before zooming into the next.

Measure on the geometry that is displayed, such as a subdivision limit surface rather than its cage. Regenerate anything derived when its basis changes, and repair an unsound representation at its foundation instead of stacking corrections on it.
