# src/film/productionFrameBoundaryToGridTick.ts#productionFrameBoundaryToGridTick

## @evidence contracts/development/implementation.md#principled-implementation

Exact rational arithmetic in `BigInt`: the numerator `f·d·ticksPerSecond` is formed without rounding, one integer division handles floor and ceiling, and the shared nearest rule compares the remainder to the halfway point, so the answer is exact for every input whose result is a safe integer and identical on every machine.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One boundary map shared by production sound rendering, delivery validation and the interval form behind WebVTT captions, so audio, captions and validation place a frame boundary on the same tick.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clock or frame rate is special-cased and no float product is used; out-of-range inputs and results throw instead of being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, what each rounding mode does with a half tick, each thrown condition, and each parameter's unit and domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: a few `BigInt` multiplications on values bounded by the safe-integer range, plus the frame-rate reduction's Euclidean algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One boundary per call with no shared state; the interval form calls it twice per interval because each end is a separate boundary.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few `BigInt` temporaries and retains nothing.
