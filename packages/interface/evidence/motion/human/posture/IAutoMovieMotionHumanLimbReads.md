# src/motion/human/posture/IAutoMovieMotionHumanLimbReads.ts#IAutoMovieMotionHumanLimbReads

## @evidence contracts/development/common.md#meaningful-documentation

States the per-limb, per-placement membership sets and bound demand, and the pair indexing.

## @evidence contracts/development/design.md#principled-representation

A membership set and a bound demand per limb and placement, the two things a fit reads of a pose's bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Held by `IAutoMovieMotionHumanBody.reads`, made by `humanLimbReads` and read by the limb view and fit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose or answer is held; an attached goal's bone is the consumer's to add.

# src/motion/human/posture/IAutoMovieMotionHumanLimbReads.ts#IAutoMovieMotionHumanLimbReads.IRead

## @evidence contracts/development/common.md#meaningful-documentation

States the three members.

## @evidence contracts/development/design.md#principled-representation

Bone names and the rig's own bound demand of the same names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member has one reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read-only sets.

# src/motion/human/posture/IAutoMovieMotionHumanLimbReads.ts#IAutoMovieMotionHumanLimbReads.IReads

## @evidence contracts/development/common.md#meaningful-documentation

States the indexing.

## @evidence contracts/development/design.md#principled-representation

A pair per limb, the placement being the one thing the sets vary by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `humanLimbReads` alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every limb present.
