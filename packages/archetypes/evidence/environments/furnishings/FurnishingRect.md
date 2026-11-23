# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.IRect

## @evidence contracts/development/design.md#principled-representation

Four edges in room-frame metres bound one axis-aligned plan rectangle; a positive extent is the producers' invariant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The room planner, the relation resolver and the grid share it for boxes, keep-outs and clearances.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rectangles are full height by design; the planner places floor furniture and wall pieces that share no plan area.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and units of each edge.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.IPlacement

## @evidence contracts/development/design.md#principled-representation

A model, its measured rest box, an origin in room metres with Y above the floor, a unit yaw and the turned plan box, which the staged frame and every fit test read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolver produces placements for related pieces and the grid for repeated groups; `furnishRoom` stages both.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plan box is derived from the rotation and bounds at construction, so the staged frame and the fit test cannot disagree.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.locate

## @evidence contracts/development/implementation.md#principled-implementation

A yaw quaternion about +Y turns the rest box, the four plan corners are enclosed and translated, and the origin is lifted by the box's underside depth so the underside meets the floor. For headings that are multiples of 90 degrees the enclosure is the turned box itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor serves overrides, absolute and facing relations, wall relations (which then set their own Y) and the grid prototype.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No size is assumed; every value comes from the measured box and the authored pose.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units and the floor seating.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four corner rotations per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.plan

## @evidence contracts/development/implementation.md#principled-implementation

Drops the box's Y extent to give its XZ rectangle in the same frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by placement and clearance construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pure projection with no tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame it keeps.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.project

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the four plan corners by the yaw and encloses them, the conservative axis-aligned bound of a turned rectangle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placements and clearances share one projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The enclosure is conservative for non-right headings and exact for right ones; nothing is tuned.

## @evidence contracts/development/common.md#meaningful-documentation

States what is enclosed and in which frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four rotations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.shift

## @evidence contracts/development/implementation.md#principled-implementation

Adds a translation to both edges of each axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one translation every placement and grid slot uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact arithmetic with no tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

States its effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.overlaps

## @evidence contracts/development/implementation.md#principled-implementation

Two rectangles overlap when both axis intersections exceed the tolerance, so faces that touch are allowed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The only overlap rule of the planner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-9 m tolerance is the engine's prop-relation tolerance, far below any furniture dimension.

## @evidence contracts/development/common.md#meaningful-documentation

States the touching rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.within

## @evidence contracts/development/implementation.md#principled-implementation

Containment of every edge within the tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The only room-fit rule of the planner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same 1e-9 m tolerance as overlap.

## @evidence contracts/development/common.md#meaningful-documentation

States its test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.obstruction

## @evidence contracts/development/implementation.md#principled-implementation

Returns the first blocked label, in insertion order, whose rectangle the box overlaps, so a refusal names a deterministic cause.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by claims and grid slots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the shared overlap rule unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the blocked rectangles, which number the pieces, clearances, keep-outs and overrides of one room.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/environments/furnishings/FurnishingRect.ts#FurnishingRect.claim

## @evidence contracts/development/implementation.md#principled-implementation

Refuses a box outside the room or entering a blocked rectangle, naming the role and the obstacle, then blocks the box under the role.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Overrides and related pieces claim through it, so their refusals read alike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never moves a box to make it fit.

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals and the effect on the blocked map.

## @evidence contracts/development/implementation.md#efficient-algorithms

One obstruction scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each claim is a distinct placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds one entry to the caller's blocked map, which lives for one room build.
