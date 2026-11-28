# src/math/AutoMovieEngineKeyframeSearch.ts#AutoMovieEngineKeyframeSearch.segment

## @evidence contracts/development/common.md#meaningful-documentation

Names the required clock shape, endpoint behavior and exact-key policy.

## @evidence contracts/development/implementation.md#principled-implementation

Binary search advances on keys below the sample, and also on an equal key under the next policy. Its initial interval of candidate indices ends at length minus two, which confines both clamped endpoints to legal segments.

## @evidence contracts/development/implementation.md#efficient-algorithms

The candidate interval halves per iteration. Only keys used for comparison are read, and one index is kept as each bound.
