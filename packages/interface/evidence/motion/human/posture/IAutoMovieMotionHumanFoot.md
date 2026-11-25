# src/motion/human/posture/IAutoMovieMotionHumanFoot.ts#IAutoMovieMotionHumanFoot.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

ankle: The ankle joint, world metres.

## @evidence contracts/development/design.md#principled-representation

ankle: The ankle joint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jumpLanding.ts (jumpLanding.of.footprint, return); actions/standFeet.ts (standFeet.of.plans, return); actions/walkFoot.ts (walkFoot.prepareStance, flat); actions/walkReach.ts (walkReach.swing.lowest, placement).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanFoot.ts#IAutoMovieMotionHumanFoot.Socket

## @evidence contracts/development/common.md#meaningful-documentation

A sole socket that bears on the floor.

## @evidence contracts/development/design.md#principled-representation

Closed choices "heel", "ball", "toe" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanFoot.ts (HumanFoot.sockets, socket); posture/HumanFoot.ts (HumanFoot.sole, socket); audit/AutoMovieMotionHumanAuditGround.ts (plants); posture/HumanFoot.ts (HumanFoot.SOCKETS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanFoot.sockets.

# src/motion/human/posture/IAutoMovieMotionHumanFoot.ts#IAutoMovieMotionHumanFoot.ISocket

## @evidence contracts/development/common.md#meaningful-documentation

point: Where it is, world metres.

## @evidence contracts/development/design.md#principled-representation

point: Where it is, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/standFeet.ts (standFeet.of.floor, s); actions/standFeet.ts (standFeet.of.plans.pivot, a); actions/standFeet.ts (standFeet.of.plans.pivot, b); actions/standFeet.ts (standFeet.of.plans.pivot, return); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure.speed, socket); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure.speed.was, s).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFoot.Socket, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanFoot.ts#IAutoMovieMotionHumanFoot.IHeelOffResult

## @evidence contracts/development/common.md#meaningful-documentation

ankle: Ankle position in world metres after lifting the heel about the toe support. toes: ADDED toe-joint flexion in clinical degrees, positive lifting the toes; added to existing flexion to keep the sole contact.

## @evidence contracts/development/design.md#principled-representation

ankle: Ankle position in world metres after lifting the heel about the toe support. toes: ADDED toe-joint flexion in clinical degrees, positive lifting the toes; added to existing flexion to keep the sole contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanFoot.ts (HumanFoot.heelOff, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
