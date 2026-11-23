# src/pose/IAutoMovieResolvedJointAngles.ts#IAutoMovieResolvedJointAngles

## @evidence contracts/development/design.md#principled-representation

The three coordinates of the axis-angle composition `jointToQuaternion` builds, recovered in closed form, so passing them back with the same axes and frame reconstructs the quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separate from the authored pose type because every field is required here; callers add the bone themselves when they build a pose joint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are never clamped to a range; a chart may be chosen by the caller's domain, but the coordinates still describe the input rotation exactly.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, why every field is required, the producer and frame ownership, and that no range is implied.
