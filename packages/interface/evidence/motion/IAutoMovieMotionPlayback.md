# src/motion/IAutoMovieMotionPlayback.ts#IAutoMovieMotionPlayback

## @evidence contracts/development/common.md#meaningful-documentation

States the local clock, arbitrary seeking and output ownership.

## @evidence contracts/development/design.md#principled-representation

Seconds identify the requested motion value independently of frame rate, subject type and placement. The caller supplies any observation inputs the evaluator declares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One callable serves a rigid transform, articulation scalar, shape or pose. Finite human phases specialize it with their own validity intervals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type implies no global contact partition, integrator, interpolation choice or correctness bound from samples.
