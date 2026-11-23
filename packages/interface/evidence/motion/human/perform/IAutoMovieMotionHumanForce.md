# src/motion/human/perform/IAutoMovieMotionHumanForce.ts#IAutoMovieMotionHumanForce

## @evidence contracts/development/common.md#meaningful-documentation

A force input acting on a performer: an instantaneous impulse or a sustained force over film time. The discriminated records preserve their different physical units and clocks.

## @evidence contracts/development/design.md#principled-representation

An impulse acts at one instant with momentum units; a sustained force acts over its declared interval with force units. Their separate records retain those different time laws.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanForce filtering, HumanLoad and HumanForceResponse consume one union supplied through the action context; hit and grappling producers retain their own calculation of force magnitudes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The discriminator separates instantaneous world newton-seconds from sustained world newtons on film time. HumanForce and the receiving reaction laws own conversion, interval handling and admission.

# src/motion/human/perform/IAutoMovieMotionHumanForce.ts#IAutoMovieMotionHumanForce.IReceiver

## @evidence contracts/development/common.md#meaningful-documentation

velocity: World metres per second at the struck point.

## @evidence contracts/development/design.md#principled-representation

velocity: World metres per second at the struck point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanForce.ts (HumanForce.ofHit, receiver).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
