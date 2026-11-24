# src/physics/physicalOneStepCaptureRegion.ts#physicalOneStepCaptureRegion

## @evidence contracts/development/common.md#meaningful-documentation

States the region's definition, its frame, the three steps of its construction and when it is empty.

## @evidence contracts/development/implementation.md#principled-implementation

A port of IHMC 201903 `OneStepCaptureRegionCalculator.calculateCaptureRegion` (l.139-235) with `CaptureRegionMathTools` (l.17-102), after Koolen et al. 2012, Part 2: the visible support vertices are the extreme centres of pressure, each predicted capture point is cop + (xi - cop) e^(omega t), its ray is cut by a circle of 100 times the range, seven arc points join the first ray's to the last's clockwise, and the hull is intersected with the reachable fan. The reference caches the support foot's outline per swing side in its sole frame, where the outline is constant, so computing it each call is the same.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reachable fan, the inside case, the predictions and rays, the arc and the intersection, numbered as in the reference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts; non-null assertions read the visible vertices by index within their length. Every constant is the reference's, cited at its declaration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the support foot's vertices and the fan's twenty, plus one convex clip of the raw region by the fan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The capture point and time change every call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalOneStepCaptureRegion.ts#physicalOneStepCaptureRegion

## @evidence contracts/development/common.md#meaningful-documentation

Documents the reachable region and the reference's constants.

## @evidence contracts/development/design.md#principled-representation

The region's constants as the reference declares them, counts and ratios.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the push recovery.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members or casts.

# src/physics/physicalOneStepCaptureRegion.ts#physicalOneStepCaptureRegion.reachable

## @evidence contracts/development/common.md#meaningful-documentation

States the fan's radius, its angle, its side and its closing vertex.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `calculateReachableRegions` (l.102-123): nineteen fan points at sign * pi * i / 18, those within half the foot width of the sole's axis moved out to it, and the point (0, sign w / 2), with sign = `RobotSide.negateIfLeftSide(1)` of the support side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop and one hull.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twenty points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The reference computes it once per parameter set; here the caller's call count decides, and its cost is constant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
