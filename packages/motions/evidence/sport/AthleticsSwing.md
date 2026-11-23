# src/sport/AthleticsSwing.ts#AthleticsSwing.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame.

## @evidence contracts/development/design.md#principled-representation

Three foot placements, world-metre ankles and unit quaternions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The departure, the barrier placement and the arrival.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No timing is stored: the caller maps its seconds to progress.

# src/sport/AthleticsSwing.ts#AthleticsSwing.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the output and the clamping.

## @evidence contracts/development/implementation.md#principled-implementation

A quadratic Bezier through its middle point on minimum-jerk progress (Flash and Hogan 1985), the rotation slerped on the same progress through the middle placement's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One control point, then a closed-form sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Progress outside [0, 1] is clamped to the ends, where the swing stands still.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The control point is computed once per path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the path's three places and one control point.
