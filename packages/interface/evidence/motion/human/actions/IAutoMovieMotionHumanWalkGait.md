# src/motion/human/actions/IAutoMovieMotionHumanWalkGait.ts#IAutoMovieMotionHumanWalkGait

## @evidence contracts/development/common.md#meaningful-documentation

States what a gait is, the units that make it fit any body and who reads it.

## @evidence contracts/development/design.md#principled-representation

Dimensionless speed and lengths, degrees for the arms and the lean, shares for the swing and the timing variation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the stepping plan reads; the walk's paces, the run's and the named gaits are its values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No body and no named style is special-cased: a drill's kept time is two plain members.
