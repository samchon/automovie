# src/motion/human/lexicon/IAutoMovieMotionHumanWeaponPresent.ts#IAutoMovieMotionHumanWeaponPresent.IWield

## @evidence contracts/development/common.md#meaningful-documentation

gun: The held weapon's prop subject id; the bare hand when absent. hand: The shooting hand; `right` when absent. hands: How many hands hold it; 2 when absent.

## @evidence contracts/development/design.md#principled-representation

gun: The held weapon's prop subject id; the bare hand when absent. hand: The shooting hand; `right` when absent. hands: How many hands hold it; 2 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.hand, p); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, context); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, context); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.carried, context); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.fire, context); lexicon/HumanWeaponFirearm.ts (HumanWeaponFirearm.fire).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanWeaponPresent.Anchor, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanWeaponPresent.ts#IAutoMovieMotionHumanWeaponPresent.Anchor

## @evidence contracts/development/common.md#meaningful-documentation

Where a line of aim starts: the eye, the cheek on a stock, the face a bow's hand draws to, the arm a lance is couched under.

## @evidence contracts/development/design.md#principled-representation

Closed choices "eye", "cheek", "face", "arm" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponPose.ts (HumanWeaponPose.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanWeaponPose.of.

# src/motion/human/lexicon/IAutoMovieMotionHumanWeaponPresent.ts#IAutoMovieMotionHumanWeaponPresent.Carriage

## @evidence contracts/development/common.md#meaningful-documentation

How the weapon is carried: on the line of aim; at a ready position with the muzzle down or up; or at a long arm's recover, the firelock upright with its butt at the support side's breast (the 1764 Manual Exercise's position from which it is cocked); or shouldered, the piece in one hand against the shoulder, its butt on the hip (the manual's Position of a Soldier under Arms).

## @evidence contracts/development/design.md#principled-representation

Closed choices "aim", "lowReady", "highReady", "recover", "shoulder" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponPose.ts (HumanWeaponPose); lexicon/HumanWeaponPose.ts (HumanWeaponPose.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanWeaponPose.

# src/motion/human/lexicon/IAutoMovieMotionHumanWeaponPresent.ts#IAutoMovieMotionHumanWeaponPresent.IPresent

## @evidence contracts/development/common.md#meaningful-documentation

target: What it is aimed at; a place straight ahead at eye height when absent. A ready position faces it without aiming. carriage: The carriage; `aim` when absent. extended: Whether the presenting arm reaches straight out along the line of aim to its own reach, a bow arm extended to the target; otherwise the working point is held the presentation's own share of the arm out. Not extended when absent.

## @evidence contracts/development/design.md#principled-representation

target: What it is aimed at; a place straight ahead at eye height when absent. A ready position faces it without aiming. carriage: The carriage; `aim` when absent. extended: Whether the presenting arm reaches straight out along the line of aim to its own reach, a bow arm extended to the target; otherwise the working point is held the presentation's own share of the arm out. Not extended when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponPose.ts (HumanWeaponPose.of, context); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present, context); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present, ahead); lexicon/HumanWeaponFirearm.ts (HumanWeaponFirearm.present); lexicon/HumanWeaponPose.ts (HumanWeaponPose.of); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanWeaponPresent.Carriage identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
