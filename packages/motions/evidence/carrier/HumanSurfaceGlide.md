# src/carrier/HumanSurfaceGlide.ts#HumanSurfaceGlide.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the support and timing assumptions and the refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Integrates the cubic speed ramps in closed form, transports ankle positions along circles about the common arc center, and fits each ankle with its own tangent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the entry frame, curvature and two tangent offsets, then samples one transported stance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a turn whose center would put the inside foot on the wrong side of its own path, and retains the entered ankle positions at time zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and two foot goals per pose with no frame-rate dependence.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses entry geometry, closed profile constants, posture carry and standing knee targets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure keeps two ankles, frame, heading and fixed scalar profile data for the duration of the action plan.
