# src/internal/RecoveryChartSurface.ts#RecoveryChartSurface.fit

## @evidence contracts/development/implementation.md#principled-implementation

Four consistent directed boundary paths define a square Dirichlet problem; exact restriction of each fitted boundary establishes collar boundary controls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All work budgets are explicit and source topology remains local to observation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source normal, replacement source mesh or arbitrary endpoint connection is accepted by the coefficient result.

## @evidence contracts/development/common.md#meaningful-documentation

The returned private map, fit residuals and controls distinguish observation evidence from the public generated field.

## @evidence contracts/development/implementation.md#efficient-algorithms

Boundary fitting and one O(I(V+E)) harmonic solve precede at most maxRefinements plus one fits. Each fit clips source triangles into at most maxPatches collar leaves and reuses reduced sparse normal equations. Incompatible local edge hierarchies and work limits retain the prior complete area candidate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepted boundary coefficients, registrations and the private harmonic map are reused across every refit. New knots restrict the same boundary authority; only interior coefficients are solved again against original observations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One chart's source arrays and numerical buffers remain live until return; maxPatches bounds the leaf registry and iteration budgets bound solves without dropping observations.
