# src/random/createAutoMovieRandom.ts#createAutoMovieRandom

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (A pure, counter-based random stream keyed by a 64-bit seed) and documents parameter `seed`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A pure, counter-based random stream keyed by a 64-bit seed) directly over its typed inputs (`seed`) as recursive, so its cost follows the recursion depth the input structure allows, delegating to `parseInt`, `seed.slice`, `philoxAutoMovie4x32`, `Math.floor`; the premises (a sixteen-digit hexadecimal seed, a nonnegative safe-integer index) are the typed contract stated in its documentation and IAutoMovieRandom, which the caller holds, so the body runs no runtime check of them. Beyond structural 0, 1 and 2 the body uses the literals 8, 16, 4294967296, 5, 67108864, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 26 lines and 3 top-level statements that reuses `parseInt`, `seed.slice`, `philoxAutoMovie4x32`, `Math.floor` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 8, 16, 4294967296, 5, 67108864 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `seed`; the dominant cost is recursive, so its cost follows the recursion depth the input structure allows, performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
