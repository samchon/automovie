# src/reaction/planVehicleDive.ts#planVehicleDive

## @evidence contracts/development/common.md#meaningful-documentation

States the timing rule, the clearance, the default side and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The dive's own plan read at each sampled second against the car's width in its frame at the arrival; the start is the arrival less the dive's clearing time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the arrival, choose the side, plan the dive, find its clearing time, then shift it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A dive that cannot clear in time is refused, never started early past the action's start.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolve per sampled dive second at plan time; constant work per sample after.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the dive law's plan whole.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the dive plan and the delay.
