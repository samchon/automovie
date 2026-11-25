# src/terrain/climbStairsFlight.ts#climbStairsFlight.surface

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the input and the result with units.

## @evidence contracts/development/implementation.md#principled-implementation

The stepped architectural surface: the floor before the first nosing, then each tread's height, capped at the landing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the one stepped-height function prepared readers share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact nosing comparison, with no blending or sampling.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares surfaceAt with prepareSurface.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/terrain/climbStairsFlight.ts#climbStairsFlight.prepareSurface

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed flight, local forward coordinate, metre height and unchanged-flight lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Shares surface's original first-nosing test, floor-derived tread index, count cap and signed riser multiplication through surfaceAt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A scalar snapshot of resolved architecture precedes one query reader; raw surface and repeated clearance probes share one stepped-height owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps exact nosing equality, floor/index arithmetic and landing cap, without blending, sampling, rounding or modifying the flight.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and height evaluation avoid repeated direction selection and flight-field lookup across the clearance path's original probe population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The climb fixes its resolved flight throughout path construction and playback; a changed flight requires another preparation, and raw surface still reads current fields each call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One path-owned closure retains five fixed scalar geometry values until released, without query coordinates, heights, poses or external handles.

# src/terrain/climbStairsFlight.ts#climbStairsFlight.flight

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The frame sits on the floor under the ankles' middle at the standing heading, and the first nosing is measured from the foremost toe, so the flight starts where the performer stands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation, the frame, then the resolved record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A riser or tread the body cannot climb throws with the bound it broke.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One read per plan and per capture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
