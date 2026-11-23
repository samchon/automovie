# src/motion/human/law/IAutoMovieMotionHumanEntryState.ts#IAutoMovieMotionHumanEntryState

## @evidence contracts/development/common.md#meaningful-documentation

acceleration: The root's linear acceleration as displayed up to the entry, world metres per second squared: a path that continues the root from the entry starts with it, so the rates of the joints a planted foot is re-solved through do not change slope at the cut. ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.

## @evidence contracts/development/design.md#principled-representation

acceleration: The root's linear acceleration as displayed up to the entry, world metres per second squared: a path that continues the root from the entry starts with it, so the rates of the joints a planted foot is re-solved through do not change slope at the cut. ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jumpTakeoff.ts (jumpTakeoff, entry); actions/stand.ts (stand.feet, entry); actions/standFeet.ts (standFeet.of, entry); actions/walkFacing.ts (walkFacing.share, entry); carrier/HumanSupportFrame.ts (HumanSupportFrame.floor, entry); everyday/seated.ts (seated.floor, entry).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMoviePose, IAutoMoviePoseVelocity, IAutoMovieVector3, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanBase identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support, AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanActionPlan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanEntryState.ts#IAutoMovieMotionHumanEntryState.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.

## @evidence contracts/development/design.md#principled-representation

ankle: The ankle joint, world metres. velocity: The ankle's velocity as displayed up to the entry, world metres per second. acceleration: The ankle's acceleration as displayed up to the entry, world metres per second squared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanMount.ts (HumanMount.grounded, foot); perform/HumanSegmentEntry.ts (HumanSegmentEntry.entry.foot, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanEntryState.ts#IAutoMovieMotionHumanEntryState.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

part: The body part that bears. kind: How it bears. support: The frame it bears on.

## @evidence contracts/development/design.md#principled-representation

part: The body part that bears. kind: How it bears. support: The frame it bears on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrier/HumanSupportFrame.ts (HumanSupportFrame.of.bearing, s); carrier/HumanSupportFrame.ts (HumanSupportFrame.contact, support); handling/handOver.ts (handOver.plan.lean, s); handling/handshake.ts (handshake.plan.seated, s); handling/handshakeMeeting.ts (handshakeMeeting.read, s); handling/pickUp.ts (pickUp.plan.plan, s).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanEntryState.ts#IAutoMovieMotionHumanEntryState.IFrom

## @evidence contracts/development/common.md#meaningful-documentation

start: Film second of its time zero. share: The share of it at which it was cut.

## @evidence contracts/development/design.md#principled-representation

start: Film second of its time zero. share: The share of it at which it was cut.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in law/IAutoMovieMotionHumanEntryState.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanActionPlan identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
