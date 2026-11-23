# src/motion/MotionTrajectoryDense.ts#MotionTrajectoryDense

## @evidence contracts/development/common.md#meaningful-documentation

States the paired construction, exact endpoint differential, normalized physical quantity, probe selection, estimator limitations and optional failed-probe snapshot.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps DP5 endpoint/RMS and matches endpoint body rates through Jr^-1. Continuous-extension weights sum to zero, so differences from the first stage exactly annihilate a constant stage array without coefficient-sum noise. Paired Hermite-Birkhoff u/v use the cited derivative nodes and recomputation; actual body velocity is Jr(r)r'. Physical units and smoothness remain caller/estimator premises, without a continuous certificate or invented absolute floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the original numeric quartic with C1 slopes, form the paired quintics only when requested, then test physical defects before accepting v.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance division, fixed step cap, midpoint-only admission or scene-specific grid is introduced. Polynomial extrema supplement method nodes without sampling a guessed time table; unresolved numeric/chart data rejects the trial.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n states builds O(n) coefficients. Physical mode adds four RHS evaluations, and model probes at a finite union of method nodes and quadratic/cubic component roots. Factoring the known endpoint zeros avoids quartic isolation and cancellation of an expanded endpoint root. A failed physical probe rejects immediately; accepted trials check every probe on both curves. Actual shape cost belongs to the callback.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the seven existing stages, endpoint state and fixed Hermite-Birkhoff weights. The paired difference's known stationary endpoints are already method nodes, so only its remaining quadratic factor needs root isolation. At each probe time both curves still compute and admit their numeric q/body-rate; only when all seven components are Object.is-equal does the second reuse the pure physical callback's scalar. Otherwise history alone may share that exact time's sufficient statistics.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The numeric step and, only after a failed physical probe, its copied time/q/body-rate/error record escape. No probe snapshot is copied on acceptance. Stages, paired temporary coefficients, root arrays, callbacks and sampled states release after this synchronous build; no raw model history is captured by playback or the numeric refusal context.
