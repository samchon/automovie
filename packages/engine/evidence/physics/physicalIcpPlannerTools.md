# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.IFloor

## @evidence contracts/development/common.md#meaningful-documentation

Documents a world floor point or vector, world x and z.

## @evidence contracts/development/design.md#principled-representation

The engine's floor coordinates the 201903 planner's points and rates are expressed in, metres or metres per second; the same shape `physicalPlanarPolygon.world` returns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the planner tools; used by the pivots, the segmented trajectory and the planner, and by the planner's callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents a capture point and its rate with units.

## @evidence contracts/development/design.md#principled-representation

The position and velocity pair every planner closed form returns, on the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the closed forms and read by the segmented trajectory, the planner and the standing builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.ICubic

## @evidence contracts/development/common.md#meaningful-documentation

Documents the cubic's duration and boundary points and rates with units.

## @evidence contracts/development/design.md#principled-representation

The boundary data of `VelocityConstrainedPositionTrajectoryGenerator` (l.118-127) as plain data; a negative or non-finite duration remains a runtime condition the evaluation treats as the reference does.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the segmented trajectory and the planner's double-support plans; evaluated by `cubic`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.capturePoint

## @evidence contracts/development/common.md#meaningful-documentation

States the divergence over a constant pivot, its rate and the on-pivot case, with units.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `CapturePointTools.computeDesiredCapturePointPosition` (l.678-685) and `computeDesiredCapturePointVelocity` (l.723-733), the solution of the capture point's dynamics xi' = omega (xi - pivot) for a constant pivot, with the reference's 1e-15 m on-pivot test and Euclid's (1 - alpha) a + alpha b interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form returning both quantities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The epsilon is the reference's. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant: one exponential.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.cornerPoints

## @evidence contracts/development/common.md#meaningful-documentation

States the backward recursion, the entry and exit times and the skipped-step rule.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `computeDesiredCornerPointsSingleSupport` with per-step splits (l.601-642): the corner points of Englsberger's two-pivot plan computed backward from the next entry pivot, each the point that diverges onto the next one in its pivot's time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the steps from last to first, as the reference's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; every time comes from the caller's durations and splits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corner count, two exponentials per step.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.cubic

## @evidence contracts/development/common.md#meaningful-documentation

States the cubic's evaluation outside, at and inside its time and its closed-form coefficients.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `VelocityConstrainedPositionTrajectoryGenerator.compute` (l.191-231) with the four position and velocity rows of `YoPolynomial.setInitialPositionVelocityZeroFinalHighOrderDerivatives` (l.434-453) solved in closed form, the unique Hermite cubic the reference's linear solve yields. The zero-duration test is Apache Commons' `Precision.equals(0, T)`, one ulp of zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reference's three early cases, then one per-axis helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.IAttached

## @evidence contracts/development/common.md#meaningful-documentation

Documents a capture point and rate in a frame's own coordinates, with units.

## @evidence contracts/development/design.md#principled-representation

A point and a vector held in the frame they are attached to, as the reference's frame points and frame vectors are, in the right-handed z-up frame `physicalPlanarPolygon.IFrame` defines (x forward, y left).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `attach`, read by `detach`; held in the segmented trajectory's sole copies and the double-support plans' ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.attach

## @evidence contracts/development/common.md#meaningful-documentation

States how a point and a vector enter a frame.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `changeFrame` on the floor: the point by the frame's inverse transform (`physicalPlanarPolygon.local`), the vector by its inverse rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.detach

## @evidence contracts/development/common.md#meaningful-documentation

States that an attached state returns to the floor where its frame now is.

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `setMatchingFrame` into the world: the point by the frame's current transform (`physicalPlanarPolygon.world`), the vector by its rotation; the inverse of `attach` for one pose, and a moved frame carries the state along.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.blend

## @evidence contracts/development/common.md#meaningful-documentation

States that position and rate interpolate alike.

## @evidence contracts/development/implementation.md#principled-implementation

The segmented trajectory's `interpolatePointFromInitialToFinalFrame` and `interpolateVectorFromInitialToFinalFrame` (l.423-446), both Euclid interpolations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two `interpolate` calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.midFeet

## @evidence contracts/development/common.md#meaningful-documentation

States the mid-feet frame's origin and axis, the floor mapping of the reference's axis and the coincident-soles case.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `MovingMidFrameZUpFrame.updateTransformToParent` (l.37-60) on the sole frames, as `HumanoidReferenceFrames` builds the mid-feet frame (l.141). The reference keeps its previous rotation when the soles are within sqrt(1e-7) m (l.55-56), state a pure function does not have, so the caller's fallback frame supplies it; two feet never come that close.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Origin, axis, then the degenerate test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-7 threshold is the reference's. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerTools.ts#physicalIcpPlannerTools.interpolate

## @evidence contracts/development/common.md#meaningful-documentation

States the interpolation and its extrapolation outside [0, 1].

## @evidence contracts/development/implementation.md#principled-implementation

Euclid's `interpolate`, (1 - alpha) a + alpha b, which the reference's capture point, corner point and final pivot formulas use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
