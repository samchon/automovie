# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IParams

## @evidence contracts/development/common.md#meaningful-documentation

on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried.

## @evidence contracts/development/design.md#principled-representation

on: The carrier's bone the body goes with; the upper chest when absent. hold: Seconds carried.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.carried, context); lexicon/HumanCarried.ts (HumanCarried.carried).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.Carry

## @evidence contracts/development/common.md#meaningful-documentation

A named way one person carries another.

## @evidence contracts/development/design.md#principled-representation

Closed choices "piggyback", "cradle", "overShoulder", "supported", "supportedLeft", "waistLift", "overheadLift", "shoulders" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan.first, c); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, carry); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, rows); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, carry); lexicon/HumanCarriedLean.ts (HumanCarriedLean.layer, carry); lexicon/HumanCarried.ts (HumanCarried.CARRIES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanCarriedDrag.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IOffset

## @evidence contracts/development/common.md#meaningful-documentation

out: Toward the hand's own side. up: Up. forward: Forward.

## @evidence contracts/development/design.md#principled-representation

out: Toward the hand's own side. up: Up. forward: Forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in lexicon/HumanCarried.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in IAutoMovieMotionHumanCarried.IOffset.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IRow

## @evidence contracts/development/common.md#meaningful-documentation

turn: The carried body's heading from the carrier's, degrees about +Y. pitch: The carried body's forward tip, degrees. legs: The carried body's hip and knee flexion and hip abduction, degrees.

## @evidence contracts/development/design.md#principled-representation

turn: The carried body's heading from the carrier's, degrees about +Y. pitch: The carried body's forward tip, degrees. legs: The carried body's hip and knee flexion and hip abduction, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.kind, rows); lexicon/HumanCarriedCoupling.ts (HumanCarriedCoupling.couple, row); lexicon/HumanCarriedCouplingFit.ts (HumanCarriedCouplingFit.fit, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.posture, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.holds, row); lexicon/HumanCarriedCouplingPose.ts (HumanCarriedCouplingPose.key, row).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionHumanCarried.IHold identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IHold

## @evidence contracts/development/common.md#meaningful-documentation

region: The carrier's own region the place is measured from. offset: The wrist's offset from it, arm lengths.

## @evidence contracts/development/design.md#principled-representation

region: The carrier's own region the place is measured from. offset: The wrist's offset from it, arm lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan); lexicon/HumanCarriedCouplingRigid.ts (HumanCarriedCouplingRigid.read).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionHumanCarried.IOffset identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IBorne

## @evidence contracts/development/common.md#meaningful-documentation

partner: The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. carry: The carry; `piggyback` when absent. hold: Seconds carried, more than none; 2 when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

partner: The carrier's subject id; absent, the body takes the carry's posture where it stands, resting on nothing. carry: The carry; `piggyback` when absent. hold: Seconds carried, more than none; 2 when absent. Exclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.borne, context); lexicon/HumanCarriedBorne.ts (HumanCarriedBorne.plan, context); lexicon/HumanCarried.ts (HumanCarried.borne).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarried.ts#IAutoMovieMotionHumanCarried.IBearing

## @evidence contracts/development/common.md#meaningful-documentation

carry: The carry; `piggyback` when absent. of: The carried person's subject id: the hands then hold where the coupled carry puts that body (#3437); the carry's own places when absent. mass: Kilograms the carried person carries besides their body, as their `borne` states it; none when absent. Inclusive minimum: 0.

## @evidence contracts/development/design.md#principled-representation

carry: The carry; `piggyback` when absent. of: The carried person's subject id: the hands then hold where the coupled carry puts that body (#3437); the carry's own places when absent. mass: Kilograms the carried person carries besides their body, as their `borne` states it; none when absent. Inclusive minimum: 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarried.ts (HumanCarried.bearing, context); lexicon/HumanCarriedBearing.ts (HumanCarriedBearing.plan, context); lexicon/HumanCarried.ts (HumanCarried.bearing).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanCarried.Carry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
