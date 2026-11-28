# src/text/AutoMovieEngineCanonicalJson.ts#AutoMovieEngineCanonicalJson.canonicalize

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the exact protocol, key and slot order, JSON coercions, accepted container shape, UTF-16 refusal and repeated-reference rule.

## @evidence contracts/development/implementation.md#principled-implementation

The encoder orders own enumerable record keys with the shared comparator and reads each selected property descriptor before encoding its value. Arrays visit own indexes in order and insert null for empty slots. Native JSON scalar spelling handles number and string escapes. Scalar strings reject lone surrogates, and only the active ancestry participates in cycle detection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Array work follows declared length. Each encountered record collects and sorts its own keys once, then builds that container's text. Traversal state and intermediate text belong to the call, and repeated references are encoded per occurrence.
