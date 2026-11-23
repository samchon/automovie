# src/motion/IAutoMovieGaitRootBob.ts#IAutoMovieGaitRootBob

## @evidence contracts/development/design.md#principled-representation

A sinusoid with the gait period supplies each baked vertical sample; gaitMotion wraps cycle time plus phase and requires finite amplitude, phase and centre before emitting the root transform, while sampleMotion linearly interpolates consecutive baked translations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three scalar parameters describe height offset, magnitude and cycle offset, reusing the enclosing gait's period instead of introducing a separate root clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bobbing uses the same formula for every rig and gait, without a creature-name preset or hidden horizontal displacement; omission emits no root transform rather than guessed movement.

## @evidence contracts/development/common.md#meaningful-documentation

States the evaluated sinusoid, local-Y metre displacement, dimensionless phase, identity rotation and scale, finite inputs and omission's unauthored-root meaning.
