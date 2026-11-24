# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep

## @evidence contracts/development/common.md#meaningful-documentation

Documents the shared vocabulary, IHMC's z-up frame and its map from automovie's y-up frame, (x, y, z) = (Z, X, Y).

## @evidence contracts/development/design.md#principled-representation

The reference's `RobotQuadrant`, `QuadrupedTimedStep` and z-up support frame, in metres, seconds and radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by every `physicalQuadruped*` port and the integrator's quadruped phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members; the quadrant is a closed union.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.Quadrant

## @evidence contracts/development/common.md#meaningful-documentation

Names the four legs as the reference's camel-case names.

## @evidence contracts/development/design.md#principled-representation

A literal union, so no fifth leg is representable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keys every per-leg record of the port.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, z up, and the unit, metres.

## @evidence contracts/development/design.md#principled-representation

IHMC's z-up tuple; `IAutoMovieVector3` is y-up, so it is not reused, and the documented map converts between them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by every quadruped port.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required; finiteness remains the caller's.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member's meaning, unit and clock.

## @evidence contracts/development/design.md#principled-representation

`QuadrupedTimedStep`: leg, goal, clearance and time interval; `end >= start` is documented, not enforced.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by the xGait planner, read by the contact sequence, the DCM planner and the step adjustment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.IPose

## @evidence contracts/development/common.md#meaningful-documentation

Documents the origin and heading.

## @evidence contracts/development/design.md#principled-representation

A z-up frame: origin and yaw, as the reference's z-up frames keep only yaw.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support frame's and the body's z-up frame, read by the xGait planner and the crossover projection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.front

## @evidence contracts/development/common.md#meaningful-documentation

States which legs are front ones.

## @evidence contracts/development/implementation.md#principled-implementation

`RobotQuadrant.isQuadrantInFront` (l.428-431).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.left

## @evidence contracts/development/common.md#meaningful-documentation

States which legs are left ones.

## @evidence contracts/development/implementation.md#principled-implementation

`RobotQuadrant.isQuadrantOnLeftSide` (l.418-421).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.across

## @evidence contracts/development/common.md#meaningful-documentation

States that it returns the other leg of the end.

## @evidence contracts/development/implementation.md#principled-implementation

`getAcrossBodyQuadrant` (l.148-177), tabulated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.next

## @evidence contracts/development/common.md#meaningful-documentation

States the regular gait's order.

## @evidence contracts/development/implementation.md#principled-implementation

`getNextRegularGaitSwingQuadrant` (l.448-477), tabulated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.previous

## @evidence contracts/development/common.md#meaningful-documentation

States that it inverts `next`.

## @evidence contracts/development/implementation.md#principled-implementation

`getNextReversedRegularGaitSwingQuadrant` (l.479-508), tabulated; it is `next`'s inverse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedStep.ts#physicalQuadrupedStep.support

## @evidence contracts/development/common.md#meaningful-documentation

States the frame's origin, height rule, heading and its behaviour for values that are not finite.

## @evidence contracts/development/implementation.md#principled-implementation

`QuadrupedReferenceFrames.getCenterOfFeetZUpFrameAveragingLowestZHeightsAcrossEnds` (l.416-425): the mean of all four soles with the mean of the lowest front and lowest hind heights (`QuadrupedSupportPolygon` l.456-510) and the nominal yaw from the summed front-minus-hind vectors (l.785-814). The z-up frame keeps the yaw of the nominal rotation, so pitch and roll are not computed. The reference's failure branches (l.259-266, l.803-806, l.861-862) keep the last frame; the caller does so with the values returned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the soles, then the heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant: four soles.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the soles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
