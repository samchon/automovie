# src/core/AutoMovieArchetypeConvexCell.ts#AutoMovieArchetypeConvexCell.Table

## @evidence contracts/development/common.md#meaningful-documentation

Names the model-scoped keys and immutable producer ownership.

## @evidence contracts/development/design.md#principled-representation

A read-only correspondence from a real part id to its admitted local cell, independent of that part's current rigid placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Builder, mass, collision, repose and placed assemblies share this same record type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent entry does not infer a cell from an arbitrary mesh; geometry identity is checked by each consuming owner.

# src/core/AutoMovieArchetypeConvexCell.ts#AutoMovieArchetypeConvexCell.ICell

## @evidence contracts/development/common.md#meaningful-documentation

Gives each field's frame, units, ownership and consumer.

## @evidence contracts/development/design.md#principled-representation

The exact visible mesh and hull share one generating boundary, while volume and principal mass data come from that same hull.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometry identifies the corresponding part, points feed collision, and the remaining local mass data feed the existing composite-mass owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No bounding proxy, guessed density or absolute mass is stored; the producer still supplies the measured total mass.

# src/core/AutoMovieArchetypeConvexCell.ts#AutoMovieArchetypeConvexCell.of

## @evidence contracts/development/common.md#meaningful-documentation

States local units, copied inputs, positive finite domain and failure behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Existing physicalHullFaces owns supporting planes and their relative conditioning tolerance. The engine's buildAutoMovieConvexHull turns its outward loops into the visible mesh through buildAutoMoviePolyhedron, and physicalHullMass integrates that hull and supplies its principal frame. The caller declares that this convex volume is a wall cell.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy/admit corners, obtain integrated hull properties, admit representability, then build its visible boundary through the engine's one hull-mesh owner, buildAutoMovieConvexHull, which the form expectation check's hull mutant also uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects degenerate/nonfinite cells, never adds thickness, changes points, closes a whole shell or fabricates a physical proxy. The visible model retains the source coordinates in ordinary number arrays; renderer upload precision remains its owner's unchanged responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

One engine hull search per V-point cell, followed by linear face integration/emission. V is the producer's small wall-cell corner set; no operation tessellates a whole shell into a hull.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same owned point-array identity reuses physicalHullFaces' weak memo for mass integration; geometry, collision and mass retain this one admitted cell.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned point/mesh buffers and scalar records for the model lifetime. No resource, input-array reference or global registry is retained.
