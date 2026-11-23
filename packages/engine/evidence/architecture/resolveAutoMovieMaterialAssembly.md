# src/architecture/resolveAutoMovieMaterialAssembly.ts#resolveAutoMovieMaterialAssembly

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates binary64 signed layer endpoints and unsigned total thickness after validation refuses non-finite derived sums/endpoints. Each start reuses the previous computed end; half-start plus half-end computes the centre without overflowing their sum. The separately accumulated overall end can differ from the final layer end by rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolution is separate from validation so a caller can judge a build-up without placing it, and this function delegates every rule to `validateAutoMovieMaterialAssembly` instead of re-checking any.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No layer, role or sense is special-cased beyond the sign the contract defines, and an invalid build-up throws rather than being clamped into usable numbers.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the placement rule, where positions start, what `total` means for the host, the units and signed coordinates, the ordered extent, the rounding caveat, and the failure effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays O(L + S) validation for L layers and S supplied substance records, then O(L) placement. Substance-index construction is not omitted from the layer-count estimate.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one build-up that coordinates no work across calls; callers that place the same build-up repeatedly own any caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned record, one resolved layer per input layer, which the caller owns; nothing else outlives the call.
