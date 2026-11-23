# src/motion/composition/IAutoMovieFramingGoal.ts#IAutoMovieFramingGoal

## @evidence contracts/development/common.md#meaningful-documentation

Gives subject-based framing, radian camera angles, fill estimate and the resolver's admission boundaries.

## @evidence contracts/development/design.md#principled-representation

Nonempty subjects, fill in (0,1], elevation in (-pi/2,pi/2) and field of view in (0,pi) are checked by resolveAutoMovieFraming; bearing and bounds remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieFraming reads this canonical goal against caller-supplied subject spheres to produce a camera pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A goal names subjects instead of embedding a renderer camera or duplicating world coordinates.
