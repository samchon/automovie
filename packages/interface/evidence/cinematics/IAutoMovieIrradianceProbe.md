# src/cinematics/IAutoMovieIrradianceProbe.ts#IAutoMovieIrradianceProbe

## @evidence contracts/development/design.md#principled-representation

Nine RGB irradiance coefficients in lux, already convolved with the clamped cosine, in a stated band order and basis, and a validity flag.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The projection `projectAutoMovieIrradianceProbe` produces it; `autoMovieIrradianceOf`, `sampleAutoMovieIrradianceVolume` and the renderer's probe texture read both members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The 27 numbers stay a flat array in the stated order rather than nested tuples, matching the texture layout; the length is checked by the producer.

## @evidence contracts/development/common.md#meaningful-documentation

States units, order, basis, how to evaluate it and what invalid means.
