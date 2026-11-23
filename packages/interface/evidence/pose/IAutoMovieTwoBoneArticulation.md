# src/pose/IAutoMovieTwoBoneArticulation.ts#IAutoMovieTwoBoneArticulation

## @evidence contracts/development/design.md#principled-representation

Both deltas are bone-local, the root's obtained by conjugating the world delta with the rest world rotation and the mid joint's by aiming the far segment's local direction at the local goal, so applying them through forward kinematics lands the end effector on the solved point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Quaternions rather than clinical angles, because the axis convention and rest frames belong to the caller and the solver stays geometry only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither delta is clamped to a range of motion here; a caller that must respect a hinge passes its axis as the bend plane instead of correcting the result afterwards.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, which joint takes which delta, the composition order with the rest rotation, who lowers them into angles, and the consumers.
