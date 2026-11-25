# src/math/readNormalizedQuaternion.ts#readNormalizedQuaternion

## @evidence contracts/development/implementation.md#principled-implementation

Both adapters retain original positive rescaling, divisions, leftfold four-square norm, sqrt, reciprocal and component products. For completed scalars, a norm square in [2^-1000,2^1000] proves divisor1: largest<2^-511 gives each rounded square<=2^-1022 and sum<=2^-1020; largest>2^510 gives one rounded square>=2^1020 and nonnegative sum at least that. Zero/nonfinite sums fail this interval. Thus only a proved ordinary input skips the magnitude gate, reusing the identical norm arithmetic; all other inputs keep the original divisor and scaled expression. Record reads retain their original order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One internal normalization module serves Quaternion.normalize's record constructor, scalar inverse/angle/slerp work and projector scores. The record entry keeps its original raw-input gate/order. fromScalars computes its exact ordinary norm once, uses a conservative binary64 certificate only for divisor1, and otherwise delegates unchanged rescaling to quaternionNormalizationDivisor. Actual consumers reuse visitors without per-call capture or pending-input state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No unit-input shortcut, dot tolerance, alternate norm, direction repair, t clamp or multiplication reassociation is introduced. Zero identity, binary64 thresholds, signed zeros and nonfinite propagation preserve the original expressions; each visitor runs exactly once synchronously and no target-dependent answer is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work stays fixed-sized. Completed-scalar norms in the certified ordinary interval omit four absolute values, maximum and component-gate checks; extreme scaled inputs additionally compute four unused raw squares before the unchanged scaled norm. Record input work/order stays unchanged. Scalar consumers omit normalized/source/scaled records as applicable and reuse static visitors; public normalize keeps fresh output and its original extreme temporary. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The completed-scalar four-square norm both proves ordinary-range admission and supplies the identical sqrt input; other magnitudes use the same original divisor owner and scaled expression. Record consumers preserve their raw reads. Every current input is normalized independently with its exact arithmetic; no input, target, context or result cache survives a call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Neither adapter retains a visitor, context, input or result. Only an extreme record-input call allocates a temporary scaled quaternion; fromScalars allocates no quaternion or collection. Every callback owns its independently returned result, with no global state, handle or task acquired.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the record entry's normalized X/Y/Z/W then raw/context arguments and the scalar entry's normalized X/Y/Z/W then context, synchronous one-visitor execution, zero identity, distinct extreme temporary ownership, nonfinite behavior, result ownership and error propagation.
