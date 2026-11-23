# src/internal/refineRecoveryResection.ts#refineRecoveryResection

## @evidence contracts/development/implementation.md#principled-implementation

Undamped column-scaled original-design rank precedes each Levenberg step. A finite positive-depth trial is accepted only on lower actual robust pixel cost over the identical observation population; 1e-8 local gradient, step or relative-cost tolerances terminate a local fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed-subset numerical owner separates conditional resection from matching, robust support selection and map/landmark refinement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point mutation, altered calibration, discarded residual, metric translation normalization, damped-rank claim or exhausted-iteration success supplies a pose. A trial behind a camera is rejected rather than clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States vector-wise robust loss, local convergence only, unchanged fitting population, positive depth and the conditional noisy-map premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N fixed pairs and I bounded iterations, analytic six-column passes and original-design solves cost O(I*S*N*6^2) with O(N) scratch. Accepted and rejected trials share one iteration ceiling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current projection rows provide robust weights, rank and the step; rejected trials retain the same current pose and residual population, with no image re-observation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only an owned pose and scalar fit counters return. Temporary rows, callbacks and borrowed observations expire on every return or throw, with no cache or external resource.
