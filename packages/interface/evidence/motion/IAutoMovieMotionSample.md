# src/motion/IAutoMovieMotionSample.ts#IAutoMovieMotionSample

## @evidence contracts/development/design.md#principled-representation

Keeps articulated body and facial expression together at one motion time, with null expression representing two unauthored endpoints rather than a fabricated facial preset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two sampled values are consumed by planting and playback without carrying redundant keyframe times or interpolation metadata.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sample shape encodes no actor-specific defaults; sampleMotion alone owns endpoint and preset-transition semantics.

## @evidence contracts/development/common.md#meaningful-documentation

States the sampler, clinical and root domains, expression absence and endpoint aliasing that consumers must preserve.
