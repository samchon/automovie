# src/motion/human/carrier/IAutoMovieMotionHumanSupportAim.ts#IAutoMovieMotionHumanSupportAim

## @evidence contracts/development/common.md#meaningful-documentation

target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. arms: How far the arms present the line off the trunk's facing, degrees.

## @evidence contracts/development/design.md#principled-representation

target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. arms: Degrees off the trunk's facing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrier/HumanSupportAim.ts (HumanSupportAim.correction, aim); carrier/HumanSupportAim.ts (HumanSupportAim.posture, aim); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan, aim); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.carried, aim).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/carrier/IAutoMovieMotionHumanSupportAim.ts#IAutoMovieMotionHumanSupportAim.IAim

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame.

## @evidence contracts/development/design.md#principled-representation

Two world points at the act's start and an angle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain points and degrees.
