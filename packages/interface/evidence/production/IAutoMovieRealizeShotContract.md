# src/production/IAutoMovieRealizeShotContract.ts#IAutoMovieRealizeShotContract.IResult

## @evidence contracts/development/design.md#principled-representation

Realization times are shot-local seconds: opening at zero, closing at durationSeconds, events within inclusive contract windows and camera samples at deduplicated sorted review boundaries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

realizeShotContract returns the compiled realization consumed by source/build validation together with compile diagnostics; result ownership belongs to the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result includes failed measurements rather than replacing them with contract prose. Empty diagnostics means checked criteria passed, not that camera samples or missing references were fabricated.

## @evidence contracts/development/common.md#meaningful-documentation

Measured contract realization and the diagnostics that determine acceptance. Realization times are shot-local seconds: opening at zero, closing at durationSeconds, events within inclusive contract windows and camera samples at deduplicated sorted review boundaries.
