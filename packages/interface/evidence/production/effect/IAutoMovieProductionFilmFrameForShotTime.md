# src/production/effect/IAutoMovieProductionFilmFrameForShotTime.ts#IAutoMovieProductionFilmFrameForShotTime.IProps

## @evidence contracts/development/design.md#principled-representation

time is shot-local seconds, while source and result indices are full-rate film frames. The source frame owns [its boundary, the next boundary); segment sourceOutFrame is excluded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionFilmFrameForShotTime serves shot review and capture consumers using the compiled timeline rather than a render-runtime cache.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing or multiply realized source frame returns null; invalid times return null, but an inconsistent timeline rate throws before time admission.

## @evidence contracts/development/common.md#meaningful-documentation

Query locating an unambiguous film occurrence of a shot-local sample. time is shot-local seconds, while source and result indices are full-rate film frames. The source frame owns [its boundary, the next boundary); segment sourceOutFrame is excluded.
