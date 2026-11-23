# src/scene/IAutoMovieEffectViewerStats.ts#IAutoMovieEffectViewerStats

## @evidence contracts/development/design.md#principled-representation

Records the actual fixed-step sample's active flag/intensity and live count after LOD/cap, with the configured capacity retained separately; counts describe sampler/instance population, not observed fragments or a GPU-budget receipt.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One small mutable summary sits beside the emitter mesh so callers inspect current sampling without rebuilding particle lists or reading native buffers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fields follow actual sample values and declared cap, without fixture target counts, native resource replacement or invented render-success flags.

## @evidence contracts/development/common.md#meaningful-documentation

Gives active sampled step, live-after-LOD population, hard configured cap and cue intensity without presenting them as measured pixels.
