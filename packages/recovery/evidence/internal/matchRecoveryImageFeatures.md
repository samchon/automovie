# src/internal/matchRecoveryImageFeatures.ts#matchRecoveryImageFeatures

## @evidence contracts/development/implementation.md#principled-implementation

Exhaustive squared Euclidean distances preserve the true nearest and second-nearest descriptors at the declared small feature budget. The squared ratio is the same Euclidean operating point; strict mutual uniqueness rejects exact repeated-feature ambiguity without a spatial or camera prior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal updates forward two-neighbour and reverse two-neighbour records, and the final pass owns copied pixel coordinates for camera estimation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No approximate index, object region, manual point, expected pose or tie-breaking choice supplies a correspondence. Every returned pair still requires independent geometry and ambiguity checks.

## @evidence contracts/development/common.md#meaningful-documentation

States Euclidean versus squared ratios, the distinct-second premise, reverse tie refusal, borrowed descriptor ownership and tentative-match meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F and G descriptors of width128, exact search costs O(128FG) and O(F+G) neighbour storage, with maxPairs checked before traversal. Streaming avoids a retained F-by-G distance table and is appropriate to the bounded high-dimensional feature population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each pair distance supplies both forward and reverse neighbour decisions; neither descriptor extraction nor pair distances are repeated in the final mutual-selection pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only O(F+G) temporary arrays and O(min(F,G)) copied matches are allocated. All state belongs to the synchronous call and no image, index, process or global cache survives it.
