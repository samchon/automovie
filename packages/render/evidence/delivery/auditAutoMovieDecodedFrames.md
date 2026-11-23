# src/delivery/auditAutoMovieDecodedFrames.ts#auditAutoMovieDecodedFrames

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit a decoder's framemd5 listing against a commissioned half-open frame clock: exactly one stream-zero time base, exactly `expectedFrames` video rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that time base, checked by exact BigInt cross products) and documents parameters `text`, `expectedFrames`, `fps`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit a decoder's framemd5 listing against a commissioned half-open frame clock: exactly one stream-zero time base, exactly `expectedFrames` video rows, and frame `i` presenting precisely `[i / fps, (i + 1) / fps)` in that time base, checked by exact BigInt cross products) directly over its typed inputs (`text`, `expectedFrames`, `fps`) as nested iteration of depth 2 (for-of over text.split(/\r?\n/u); every over [numerator, denominator]; map over trimmed .split(",")), delegating to `Number.isSafeInteger`, `text.split`, `line.trim`, `trimmed.startsWith`, `Number`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (8 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 6, 5, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 90 lines and 9 top-level statements that reuses `Number.isSafeInteger`, `text.split`, `line.trim`, `trimmed.startsWith`, `Number` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 10 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `text`, `expectedFrames`, `fps`; the dominant cost is nested iteration of depth 2 (for-of over text.split(/\r?\n/u); every over [numerator, denominator]; map over trimmed .split(",")), performed once per call with 15 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 15 allocation sites become the returned value or die with the call, so nothing grows.
