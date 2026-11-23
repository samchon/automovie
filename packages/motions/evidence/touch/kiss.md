# src/touch/kiss.ts#kiss.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the unknowns, the grid and the result's units.

## @evidence contracts/development/implementation.md#principled-implementation

The mouth's distance to the point is minimised one freedom at a time: the forward lean and the neck on a grid, coarse at 5 degrees and refined at 1 degree, then the lean to the side at 1 degree steps, then, only when a miss over `NEAR` remains and a stance bears the body, the least heel raise that closes it; the lean and the neck are fitted again after each.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One miss function, a sagittal grid and two line searches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The miss is returned, never hidden; the ranges are the lean's, the neck's and the ankle's working ranges (provisional).

## @evidence contracts/development/implementation.md#efficient-algorithms

Every original sagittal-grid and line-search candidate retains its actual raw heading/rise/pivot and authored mouth FK. Only canonical mouth demand and primitive fixed head-twist constants prepare once; point-only observation omits unused directions, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original lean/rise/head/trunk owners remain. Borrowed entry/stance fields or getters are never frozen by identity or raise equality; every candidate reads them independently. A genuine mouth reader shares only fixed canonical region/rig demand, and the exact FK workspace checks current scalar dependencies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search owns one lazy exact reader, fixed mouth-name producer and primitive head constants until return or throw. Each current posture/map/displacement ends with its observation; only selected angles and miss escape, with no raw offset, rise-group answer or candidate history retained.

# src/touch/kiss.ts#kiss.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal; the law's doc gives the solve and the timing.

## @evidence contracts/development/implementation.md#principled-implementation

The lean and the neck solved against the target at the start, the feet planted and no balance solved, then raised and lowered on the phrase envelope with the head's turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Target, solve, clock, the body's primitive, the legs' when the heels rise, the head's, composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn and the hold are named provisional constants; an unreachable target leaves a measured miss.

## @evidence contracts/development/implementation.md#efficient-algorithms

One grid solve at plan time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the lean, the rise, the planted legs' lowering, the head share and the joint pulse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the solved angles, the stance and the clock.
