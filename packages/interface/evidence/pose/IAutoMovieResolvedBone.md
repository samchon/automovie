# src/pose/IAutoMovieResolvedBone.ts#IAutoMovieResolvedBone

## @evidence contracts/development/design.md#principled-representation

Standard hierarchical forward kinematics: local rotation is rest times articulation, world rotation is parent world times local, and world position is parent world position plus the rest translation rotated by the parent's world rotation, so each field is exactly what the walk composed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both the local rotation a scene graph needs and the world frame a validator needs in one record, so neither consumer recomputes the walk; it is structurally an `IAutoMovieChainBone` for the IK solvers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A detached bone is omitted rather than given a placeholder transform, so a consumer cannot read a world position the walk never computed.

## @evidence contracts/development/common.md#meaningful-documentation

States who reads which fields, the frame and unit of world values, the composition of each field, and which bones are present in what order.
