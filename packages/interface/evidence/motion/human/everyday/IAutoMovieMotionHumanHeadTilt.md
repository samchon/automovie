# src/motion/human/everyday/IAutoMovieMotionHumanHeadTilt.ts#IAutoMovieMotionHumanHeadTilt

## @evidence contracts/development/common.md#meaningful-documentation

The fields state the total angle, its sign and range, and the duration of the full phrase.

## @evidence contracts/development/design.md#principled-representation

One signed clinical angle distinguishes the two sides and one duration controls the pace of the phrase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law owns the timing proportions and neck-to-head distribution. Authors supply the angle and optionally the duration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The angle is relative to the actor's posture and uses the rig's own clinical sign. The law checks numeric bounds at plan time.
