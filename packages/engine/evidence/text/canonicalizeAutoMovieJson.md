# src/text/canonicalizeAutoMovieJson.ts#canonicalizeAutoMovieJson

## @evidence contracts/development/implementation.md#principled-implementation

Finite JSON numbers and Unicode scalar strings use JSON escaping, object keys sort by UTF-16 units, unsupported array slots become null and unsupported object values are omitted; an ancestry set rejects cycles while permitting repeated nonrecursive references.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One browser-compatible engine owner serves production and viewer identity, with closed domain refusals separated from hashing and byte encoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Own data descriptors avoid invoking ordinary getters, but Proxy reflection traps can execute. Arrays are admitted before prototype inspection, while non-array objects require this realm's Object.prototype or null; no depth or output-size budget is enforced.

## @evidence contracts/development/common.md#meaningful-documentation

Documents holes, omitted members, finite/Unicode refusal, accepted container prototypes and typed domain failures; allocation, recursion and Proxy failures can remain ordinary host errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traversal covers every encoded occurrence and string unit, plus sum(K log K) key sorting per object; repeated shared subtrees are re-encoded, intermediate text grows with output and recursion depth is unbounded.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The comparator and Unicode admission are shared within encoding; ancestry is path-local rather than a memoization cache, so cycles fail and repeated references retain ordinary JSON tree expansion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns returned text; the call-local ancestry set removes entered containers in finally on success or failure, and no partial text or host handle is published.
