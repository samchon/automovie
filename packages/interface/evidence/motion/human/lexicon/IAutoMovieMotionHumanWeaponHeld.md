# src/motion/human/lexicon/IAutoMovieMotionHumanWeaponHeld.ts#IAutoMovieMotionHumanWeaponHeld.ISetup

## @evidence contracts/development/common.md#meaningful-documentation

support: The support hand's hold on the weapon, or null for one hand or the bare hand. slide: Half the fore-end's length, metres: how far back the support hand may take it. arm: The arm's length, upper arm and forearm, metres.

## @evidence contracts/development/design.md#principled-representation

support: The support hand's hold on the weapon, or null for one hand or the bare hand. slide: Half the fore-end's length, metres: how far back the support hand may take it. arm: The arm's length, upper arm and forearm, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.supported, s); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.carried, s); lexicon/HumanWeaponPose.ts (HumanWeaponPose.of, s); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.fire).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanStrikingHeld.ITool, IAutoMovieMotionHumanStrikingBlade.ISupport, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
