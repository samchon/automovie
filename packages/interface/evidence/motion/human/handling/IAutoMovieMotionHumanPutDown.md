# src/motion/human/handling/IAutoMovieMotionHumanPutDown.ts#IAutoMovieMotionHumanPutDown.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the held prop, destination frames, socket defaults, hand and heading as well as the supported moving receiver.

## @evidence contracts/development/design.md#principled-representation

World points and bone offsets use metres. Socket placement selects a source and a receiver affordance by id, with runtime admission of the displayed receiver's authored track and the fitted contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.putDown, params); handling/putDown.ts (putDown.plan, context); handling/putDown.ts (putDown.demands, ahead); handling/putDownTarget.ts (putDownTarget.of, context); handling/putDown.ts (putDown.plan); handling/putDownTarget.ts (putDownTarget.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieRigidTransform, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
