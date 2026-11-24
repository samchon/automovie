# src/delivery/admitAutoMovieControlPasses.ts#admitAutoMovieControlPasses

## @evidence contracts/development/common.md#meaningful-documentation

States what is admitted, in which order, each refusal and its reason, and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

Checks each name against `isGuidePass`, the runtime list of the closed union, and refuses `beauty` and repeats, because the film is the beauty pass and a repeat would write one file twice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function shared by the CLI's option and by `renderAutoMovieDrawnVideo`, so both refuse the same lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pass is silently dropped or deduplicated; every refusal names the pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the list with a quadratic duplicate check over at most seven passes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
