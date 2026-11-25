# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IHold

## @evidence contracts/development/common.md#meaningful-documentation

point: Metres.

## @evidence contracts/development/design.md#principled-representation

point: Metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.holds.at, return); lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IGrip

## @evidence contracts/development/common.md#meaningful-documentation

Names the common frame, units and distinct point and direction transforms.

## @evidence contracts/development/design.md#principled-representation

The point and normal come from the actual held surface. Clearance partitions the placed borne segments into permitted resting surfaces and the other segments the arm must clear.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveCarriedHoldGeometry constructs one grip per occupied hand and HumanCarriedGrip tests its actual hand and arm against that geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The grip uses the measured segment shapes and the signed surface normal of the named region. A hand without a grip has no clearance record.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IBearer

## @evidence contracts/development/common.md#meaningful-documentation

body: The bearer's body. bones: Its displayed bones at the instant.

## @evidence contracts/development/design.md#principled-representation

body: The bearer's body. bones: Its displayed bones at the instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.posture, bearers); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.posture.of, return); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.posture.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IHoldsResult

## @evidence contracts/development/common.md#meaningful-documentation

places: Left and right hand holds in that order; null for a hand that does not hold.

## @evidence contracts/development/design.md#principled-representation

places: Left and right hand holds in that order; null for a hand that does not hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.holds, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanCarriedCouplingPose.IHold identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IStanceBent

## @evidence contracts/development/common.md#meaningful-documentation

incline: Forward trunk inclination in degrees. depth: Lowering as a share of the body's squat drop in [0, 1]; zero is the standing alignment.

## @evidence contracts/development/design.md#principled-representation

incline: Forward trunk inclination in degrees. depth: Lowering as a share of the body's squat drop in [0, 1]; zero is the standing alignment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.stance, bent).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedCouplingPose.stance.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedCouplingPose.ts#IAutoMovieMotionHumanCarriedCouplingPose.IStoodBent

## @evidence contracts/development/common.md#meaningful-documentation

incline: Forward trunk inclination in degrees. depth: Lowering as a share of the body's squat drop in [0, 1]; zero is the standing alignment.

## @evidence contracts/development/design.md#principled-representation

incline: Forward trunk inclination in degrees. depth: Lowering as a share of the body's squat drop in [0, 1]; zero is the standing alignment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.stood, bent).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedCouplingPose.stood.
