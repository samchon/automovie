# src/animals/spotEquineTakeoff.ts#spotEquineTakeoff

## @evidence contracts/development/common.md#meaningful-documentation

States the adjustment, its bound and the case without a spot.

## @evidence contracts/development/implementation.md#principled-implementation

The posture is read at the middle of a nominal `EquineJump.LONGEST` flight, where the trunk is level and the limbs tucked. A shift d spread over a window W runs the hoof clock at (W − d)/W, so each stride's time s becomes s W/(W − d); keeping that within s ± the declared spread bounds d on each side, and `EquineJump.SPOTS` even steps on each side are measured in closed form (`leastEquineFlight`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One unheld and one nominal assembly, one posture, then the spots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A spot whose body overlaps an obstacle at takeoff or lands past the leg is discarded; no stride leaves the declared spread.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two trial assemblies and at most two pose samples per candidate, then 2 `EquineJump.SPOTS` + 1 closed forms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The posture and a gap's landing are read once for every spot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one record.
