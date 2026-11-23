# src/motion/human/next/IAutoMovieMotionHumanPrehension.ts#IAutoMovieMotionHumanPrehension

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Prehension family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Prehension laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanPrehension.ts#IAutoMovieMotionHumanPrehension.ITransport

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds the transport lasts. wrist: The wrist at a second of the transport (clamped to its span), metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanPrehension.ts (HumanPrehension.transport, return); handling/handOver.ts (handOver.plan); handling/handshake.ts (handshake.plan); handling/pickUp.ts (pickUp.plan); handling/putDown.ts (putDown.plan); handling/receive.ts (receive.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanPrehension.ts#IAutoMovieMotionHumanPrehension.ITransportRotation

## @evidence contracts/development/common.md#meaningful-documentation

from: Initial world orientation as a unit quaternion. to: Final world orientation as a unit quaternion.

## @evidence contracts/development/design.md#principled-representation

from: Initial world orientation as a unit quaternion. to: Final world orientation as a unit quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanPrehension.ts (HumanPrehension.transport, rotation).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
