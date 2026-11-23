# src/fluid/fluidStateDigest.ts#fluidStateDigest

## @evidence contracts/development/implementation.md#principled-implementation

Applies FNV-1a to eight little-endian DataView bytes per selected Number, using Math.imul and unsigned wrapping. Finite binary64 values and signed zero have explicit serialization; NaN payload portability and collision freedom are not promised, and omitted ids/times/lengths prevent whole-record identity claims.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function over the state's numeric fields in a fixed order, with no intermediate concatenation and no dependency on a hashing library.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field is rounded before hashing to make near states agree, and no state or caller is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the hash/output, serialization order, omitted fields and boundaries, signed-zero/NaN limits and why equality is not certified.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `cells + faces + 5` numbers with a single eight-byte scratch view, `O(cells + faces)` time and constant extra space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Hashes the state it is given once per call and caches nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the eight-byte scratch buffer dies with the call.
