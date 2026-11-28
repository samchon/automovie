# src/schema/IAutoMovieHumanHalluxPoseSchema.ts#IAutoMovieHumanHalluxPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description distinguishes the base joint's two axes and the toe's single distal flexion, with signs defined relative to the other toes.

## @evidence contracts/development/design.md#principled-representation

Typia bounds base flexion to [-70, 45] degrees, base abduction to [-15, 15] and interphalangeal flexion to [0, 90]. Human maps these rows to the proximal and distal hallux joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foot schema uses this optional hallux-specific record. Lesser toes use their own shared three-joint record.
