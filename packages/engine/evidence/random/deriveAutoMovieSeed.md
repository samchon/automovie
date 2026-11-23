# src/random/deriveAutoMovieSeed.ts#deriveAutoMovieSeed

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (A 64-bit seed derived from a film seed and stable string ids, as sixteen lowercase hexadecimal digits) and documents parameters `filmSeed`, `ids`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A 64-bit seed derived from a film seed and stable string ids, as sixteen lowercase hexadecimal digits) directly over its typed inputs (`filmSeed`, `ids`) as a single pass (for-of over [filmSeed, ...ids]), delegating to `bytes.push`, `encoder.encode`, `hashAutoMovieFnv1a64`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 255, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 7 lines and 4 top-level statements that reuses `bytes.push`, `encoder.encode`, `hashAutoMovieFnv1a64` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 255 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `filmSeed`, `ids`; the dominant cost is a single pass (for-of over [filmSeed, ...ids]), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
