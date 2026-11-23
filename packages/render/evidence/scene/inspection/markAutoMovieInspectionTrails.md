# src/index.ts#markAutoMovieInspectionTrails

## @evidence contracts/development/common.md#meaningful-documentation

States the three marks of a trail, how the emphasised sample is chosen, the stationary case, the frame, and tabulates both kinds.

## @evidence contracts/development/implementation.md#principled-implementation

A still shows a pose, not a movement, so the path an object travels and where on it the drawn second falls are drawn from measured positions instead of left for the eye to infer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the trails, with one nearest-sample search each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sample is interpolated: every tick and the emphasis are measured positions. The labels and colours are those `AUTO_MOVIE_INSPECTION_KINDS` gives the two kinds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of sampled data for one second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The line and the ticks share the trail's position array; nothing else is kept.
