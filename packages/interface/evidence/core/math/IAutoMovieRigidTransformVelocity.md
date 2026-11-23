# src/core/math/IAutoMovieRigidTransformVelocity.ts#IAutoMovieRigidTransformVelocity.IResult

## @evidence contracts/development/design.md#principled-representation

Linear and angular world vectors report translation and principal rotation secants in metres/second and radians/second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigidTransformVelocity returns the two rigid-frame rates used by motion observations; the existing vector contract owns their components.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The observation is neither an instantaneous derivative nor evidence of intervening turns; invalid intervals, rotations and exact half-turn ambiguity refuse.

## @evidence contracts/development/common.md#meaningful-documentation

Documents units, world frame, shortest-arc branch, input ownership and refusal.
