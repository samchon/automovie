# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingFit.ts#IAutoMovieMotionHumanCarriedCouplingFit

## @evidence contracts/development/common.md#meaningful-documentation

stance: The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk inclination, degrees, and lowering, a share of a squat's drop. legs: Both legs' hip flexion, knee flexion and hip abduction the key pose takes, degrees.

## @evidence contracts/development/design.md#principled-representation

stance: The bearer's stance (`HumanCarriedCouplingPose.stance`): trunk inclination, degrees, and lowering, a share of a squat's drop. legs: Both legs' hip flexion, knee flexion and hip abduction the key pose takes, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit, return); lexicon/HumanCarriedCouplingRigid.ts (HumanCarriedCouplingRigid.read, return); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit.gaps).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingFit.ts#IAutoMovieMotionHumanCarriedCouplingFit.IFit

## @evidence contracts/development/common.md#meaningful-documentation

States the members and their frames.

## @evidence contracts/development/design.md#principled-representation

A rigid map as its turn and its point map, so callers place any point the same way, with the two postures it maps between.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stance, the legs, the turn and the point map.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point map keeps the resting contact exact; no caller rebuilds it.
