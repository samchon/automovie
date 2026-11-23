# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase

## @evidence contracts/development/common.md#meaningful-documentation

States what a base is, who declares it, how it reaches the next action and what a moving seat is. seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows. at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y.

## @evidence contracts/development/design.md#principled-representation

The base kinds are BML 1.0's posture stances with the supports #3337 adds; only a seated base carries a seat, so a seat on a standing body cannot be written. seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows. at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union, its kinds as data, the seat record and the one rule that passes a base on; read by the entry state, by `rise` after a ride and by the base primitives. Runtime boundary references: law/HumanBase.ts (HumanBase.after, return); handling/pickUpPosture.ts (pickUpPosture.leaned).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The seat record is declared here and the sitting actions' own seat type satisfies it, so no law file is imported by the entry state. Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanEntryState.ISupport identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase.ISeated

## @evidence contracts/development/common.md#meaningful-documentation

seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows.

## @evidence contracts/development/design.md#principled-representation

seat: The seat sat on, as the action that sat down declared it. Absent when the body is seated by an action that declares no base, which only its seat contact shows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in law/HumanBase.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBase.ISeat identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase.ISeat

## @evidence contracts/development/common.md#meaningful-documentation

at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.

## @evidence contracts/development/design.md#principled-representation

at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/rise.ts (rise.plan); law/HumanBase.ts (HumanBase.MOUNTS); lexicon/HumanMountOff.ts (HumanMountOff.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase.IPlain

## @evidence contracts/development/common.md#meaningful-documentation

kind: The discriminator.

## @evidence contracts/development/design.md#principled-representation

kind: The discriminator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in law/HumanBase.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBase.Kind identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase.Kind

## @evidence contracts/development/common.md#meaningful-documentation

One base kind.

## @evidence contracts/development/design.md#principled-representation

Closed choices "standing", "seated", "kneeling", "crouched", "lying", "leaning", "hanging", "airborne", "immersed" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/floorEntry.ts (floorEntry.BASES); floor/floorEntry.ts (floorEntry.standing); floor/getUp.ts (getUp.plan); law/HumanBase.ts (HumanBase.KINDS); law/HumanBase.ts (HumanBase.after).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in floorEntry.BASES.

# src/motion/human/law/IAutoMovieMotionHumanBase.ts#IAutoMovieMotionHumanBase.IAfterProps

## @evidence contracts/development/common.md#meaningful-documentation

supports: Borrowed supports open at the sampled instant. share: Action progress; the declared final base takes precedence at share >= 1 - 1e-9.

## @evidence contracts/development/design.md#principled-representation

supports: Borrowed supports open at the sampled instant. share: Action progress; the declared final base takes precedence at share >= 1 - 1e-9.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanBase.ts (HumanBase.after, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBase, IAutoMovieMotionHumanEntryState.ISupport identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
