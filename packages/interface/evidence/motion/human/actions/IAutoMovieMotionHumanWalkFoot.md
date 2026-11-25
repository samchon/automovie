# src/motion/human/actions/IAutoMovieMotionHumanWalkFoot.ts#IAutoMovieMotionHumanWalkFoot.IScheduled

## @evidence contracts/development/common.md#meaningful-documentation

swing: A swinging foot's share of its swing and the swing's two ends, seconds.

## @evidence contracts/development/design.md#principled-representation

swing: A swinging foot's share of its swing and the swing's two ends, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walk.ts (walk.locomote.settle, feet); actions/walk.ts (walk.locomote.solve, return); actions/walkReach.ts (walkReach.weight, foot); actions/walkReach.ts (walkReach.pelvis, feet); actions/walkReach.ts (walkReach.ground, feet); reaction/staggerAdmission.ts (staggerAdmission, feet).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in walk.locomote.settle.

# src/motion/human/actions/IAutoMovieMotionHumanWalkFoot.ts#IAutoMovieMotionHumanWalkFoot.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

toes: The toes' flexion from the foot, degrees, positive lifting them.

## @evidence contracts/development/design.md#principled-representation

toes: The toes' flexion from the foot, degrees, positive lifting them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walk.ts (walk.locomote.swung, return); actions/walkFoot.ts (walkFoot.prepareStance, return); actions/walkFoot.ts (walkFoot.prepareSwing, return); actions/walkReach.ts (walkReach.swing, foot); actions/walkReachStance.ts (walkReachStance.prepare, foot); actions/walkStepFoot.ts (walkStepFoot.schedule.leave, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFoot.IPlacement identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
