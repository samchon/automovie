# src/terrain/climbStairsRail.ts#climbStairsRail

## @evidence contracts/development/common.md#meaningful-documentation

States how the rail and hand move, when the support is released and what refuses.

## @evidence contracts/development/implementation.md#principled-implementation

Derives the actual bar axis and length from the authored fixture, fitting the grip on that axis over the existing fitted tread trajectory.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the static bar once, then use its axis both to place and verify the same wrist goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing or unreachable fixtures refuse; the measured grip comes from resolved bones.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant bar geometry; one arm carry per sample, and one resolve per motion-evidence sample time for the plan-time grip check.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The bar's axis, the hand frame and grip offset are prepared once and shared by placement and check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the stair plan and the prepared bar.
