# src/motion/AutoMovieEngineMotionSampling.ts#AutoMovieEngineMotionSampling.sampleTimes

## @evidence contracts/development/common.md#meaningful-documentation

A finite nonnegative seconds duration and finite positive Hz rate produce an owned grid starting at zero. The declaration gives the zero-duration result and the reason out-of-domain input throws.

## @evidence contracts/development/implementation.md#principled-implementation

The duration helper fixes the lower endpoint at zero and delegates to the same window owner as `windowSampleTimes`. That owner checks rate admissibility for every window, so zero duration succeeds only for positive finite rates and gives exactly one sample.

## @evidence contracts/development/implementation.md#efficient-algorithms

The helper makes one call, with the original duration and rate, and returns the owner's array directly. It adds no traversal, working array, or retained state.

# src/motion/AutoMovieEngineMotionSampling.ts#AutoMovieEngineMotionSampling.windowSampleTimes

## @evidence contracts/development/common.md#meaningful-documentation

The endpoints are finite ordered seconds, the rate is positive finite Hz even at zero width, and the new array retains endpoints subject to rounded duplicate coalescing. The declaration gives the refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Admit finite endpoints and positive finite rate before recognizing a singleton. For a nonzero window, the ceiling of span times rate bounds the number of grid steps. Scaling the endpoints by one half allows counts and positions to be computed across a finite endpoint pair whose span or offset would overflow. Only advances beyond the prior represented instant are emitted. The final endpoint is emitted exactly once.

## @evidence contracts/development/implementation.md#efficient-algorithms

The window owner calculates the candidate count once and rejects a grid that cannot fit in an array. It visits each earlier candidate once, keeping the prior retained instant and the caller-owned result. No precomputed grid or shared cache is allocated.
