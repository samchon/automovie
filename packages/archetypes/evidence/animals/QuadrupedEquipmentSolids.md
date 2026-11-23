# src/animals/QuadrupedEquipmentSolids.ts#QuadrupedEquipmentSolids

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical model metres, real producer-owned spheres, analytic finite-cylinder/box separation, conservative top support and outward binary64 rounding.

## @evidence contracts/development/design.md#principled-representation

Private independent sphere copies describe the same solids emitted by the producer. Analytic finite-cylinder distances and the engine's point-to-box distance admit real equipment; a conservative upper support envelope determines connected bridge height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The equipment plan delegates its live additional-sphere admission and pack bridge support here; species construction and emitted geometry retain their existing owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No species branch, obstacle-specific offset, hidden tolerance, mesh proxy, guessed anatomy or render-only displacement supplies clearance.

# src/animals/QuadrupedEquipmentSolids.ts#QuadrupedEquipmentSolids.prototype.above

## @evidence contracts/development/common.md#meaningful-documentation

Names bridge footprint, finite metre inputs, additional solid support and the conservative sphere-top choice rather than a minimum-height fit.

## @evidence contracts/development/implementation.md#principled-implementation

A sphere whose radius-plus-bar-plus-clearance reaches the finite XZ segment contributes its top plus bar radius and clearance. Each sum rounds outward to the next representable binary64 value, so representation cannot lower a support plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Inspect each sphere's XZ distance, raise the common support plane when needed and admit its finite result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither clearance nor a collision tolerance is changed. No species name, fixture constant, iterative search or invisible displacement is used; the emitted connecting posts consume this height.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) arithmetic for S additional spheres and one call-local eight-byte rounding view; no model, mesh, solver or geometry search is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both pack bridge planes share the producer sphere records and this support owner; later primitive admission verifies their real solids.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no bridge input or rounding view; the owner keeps O(S) independent sphere copies for its own lifetime.

# src/animals/QuadrupedEquipmentSolids.ts#QuadrupedEquipmentSolids.prototype.rod

## @evidence contracts/development/common.md#meaningful-documentation

Defines cylinder endpoints/radius, authored clearance and exact finite axial/radial distance to a solid cylinder.

## @evidence contracts/development/implementation.md#principled-implementation

Project the sphere centre onto the cylinder axis, subtract its circular radius from radial distance and its finite span from axial distance. The hypotenuse of the two nonnegative outside distances must reach sphere radius plus clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis preparation, then one analytic distance and ordinary structured refusal per intersecting sphere.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The engine exposes capsule distance but no flat-capped cylinder distance. A capsule would add hemispherical ends absent from these real bars, so this owner uses their finite-cylinder geometry directly. Intersection is refused without a tolerance, clipping or shape change.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) arithmetic in constant auxiliary storage, without a mesh query or solver.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every yoke, rail, post, bridge and hook cylinder uses this admission after the common plan validates its positive span.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no cylinder, query or builder; only this owner's private sphere records remain.

# src/animals/QuadrupedEquipmentSolids.ts#QuadrupedEquipmentSolids.prototype.box

## @evidence contracts/development/common.md#meaningful-documentation

Defines full box sizes/centre and authored minimum body clearance in canonical metres.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's exact point-to-box signed distance must reach sphere radius plus clearance. Coincident segment endpoints select its point query, with no iterative segment search.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Describe the box once, query each sphere centre through the existing engine owner and refuse overlap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A side pad cannot pass through an additional real body solid; no surface-only marker, tolerance, clipping or guessed species dimension hides intersection.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) scalar arithmetic in constant auxiliary storage, without meshes or fitting.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both side pads reuse physicalShapeSegmentDistance rather than introducing another point-to-box distance formula; shape material identity is inert metadata for this geometry-only query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no box, body or builder; refusal owns only ordinary diagnostic facts.
