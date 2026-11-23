# src/motion/IAutoMovieKeyframe.ts#IAutoMovieKeyframe

## @evidence contracts/development/design.md#principled-representation

A keyframe stamps one static pose and optional expression with clip-local seconds; sampleMotion interpolates from this frame with its outgoing easing, treating absent expression channels as neutral, and validateMotion checks the static and temporal domains together.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pose and expression retain their own structures while time, easing and cubic controls add only segment information; the surrounding motion owns rig identity, duration and looping.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null expression interpolates from neutral rather than snapping an authored far expression into the whole segment; cubic controls are required only for their curve and stray controls on other curves are refused.

## @evidence contracts/development/common.md#meaningful-documentation

Defines outgoing easing, finite ordered beat-independent seconds, neutral-expression fades, cubic control ordering and the monotone-time x bounds with unconstrained finite y overshoot.
