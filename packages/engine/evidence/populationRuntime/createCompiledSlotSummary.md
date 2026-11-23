# src/populationRuntime/createCompiledSlotSummary.ts#createCompiledSlotSummary

## @evidence contracts/development/implementation.md#principled-implementation

Each point updates axis minima/maxima and the historical centroid*(n-1)/n+point/n fold; keeping this exact operation order preserves compiled population digests. Callers supply admitted finite positions in slot order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One accumulator owns the arithmetic shared by range, chunk and whole-population summaries; it exposes only add and finish instead of caching placement laws.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture or model changes the fold; an empty accumulator retains infinite bounds and zero centroid, so admitted populations must contain slots.

## @evidence contracts/development/common.md#meaningful-documentation

The returned methods document borrowed point inputs and transfer of the summary objects; callers finish only after all points and do not add after transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each add performs constant arithmetic and retains three vectors and one count; N points take O(N) time and O(1) auxiliary memory.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Range and chunk owners share the same fold implementation; each accumulator represents its own ordered point sequence and is never reused across mutable population inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the closure until finish returns its vectors; it holds no handles, callbacks or point history, and failures leave only ordinary collectable objects.
