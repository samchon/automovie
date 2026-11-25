# src/physics/IAutoMovieProjectPhysicalTargets.ts#IAutoMovieProjectPhysicalTargets.IResult

## @evidence contracts/development/common.md#meaningful-documentation

World motor-goal poses projected onto the profile's fixed-pivot joint tree.

## @evidence contracts/development/design.md#principled-representation

Root placements are preserved; child anchors coincide and relative rotations obey the declared coordinates. Maximum changes use metres and radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectPhysicalTargets allocates a new target record with detached root poses and newly reconstructed child poses; authored inputs remain unchanged.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer throws for missing joint targets or an unreachable parent tree. These are goal adjustments, not observed native poses or silent proof that the authored performance was preserved.
