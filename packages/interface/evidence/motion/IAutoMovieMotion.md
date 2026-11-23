# src/motion/IAutoMovieMotion.ts#IAutoMovieMotion

## @evidence contracts/development/design.md#principled-representation

An ordered sparse timeline is sampled in seconds using each outgoing frame's easing, joint-angle interpolation and root quaternion slerp; validateMotion requires finite positive duration, increasing bounded times, target-rig poses and supported interpolation controls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clip owns identity, target skeleton, duration and loop semantics around reusable keyframes; optional gait-cycle provenance adds continuity without altering the general sampler representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Frame rate belongs to the consumer rather than the stored animation, and a missing cyclic provenance record is not inferred from a gait name; the author remains responsible for a looping clip's endpoint continuity.

## @evidence contracts/development/common.md#meaningful-documentation

States second-based timing, at least two ordered keyframes, one target rig, loop wrapping and author-owned seam continuity, and gait-cycle absence and beat-handoff behavior.
