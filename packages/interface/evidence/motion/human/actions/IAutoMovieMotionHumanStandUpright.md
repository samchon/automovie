# src/motion/human/actions/IAutoMovieMotionHumanStandUpright.ts#IAutoMovieMotionHumanStandUpright.IAlignment

## @evidence contracts/development/common.md#meaningful-documentation

joints: Spine, chest, neck and head flexion, clinical degrees. lean: Forward lean of the centre of mass ahead of the ankles, metres in the body frame.

## @evidence contracts/development/design.md#principled-representation

joints: Spine, chest, neck and head flexion, clinical degrees. lean: Forward lean of the centre of mass ahead of the ankles, metres in the body frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/standUpright.ts (standUpright.of, return); actions/standUpright.ts (standUpright.solve, return); actions/jump.ts (jump.plan); actions/jumpPush.ts (jumpPush); actions/stand.ts (stand.plan); actions/standUpright.ts (standUpright.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
