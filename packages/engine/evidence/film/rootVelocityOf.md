# src/film/rootVelocityOf.ts#rootVelocityOf

## @evidence contracts/development/implementation.md#principled-implementation

A first-order backward difference of the folded world root, the estimate that reads only the past of the instant, which is what a beat that continues from this one inherits; the loop seam is excluded from the window because the root's jump there is a wrap, not motion, and `positiveModulo` keeps the phase in `[0, duration)` for any finite time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exported rule with two private steps, sampling the folded root and differencing a window, so the seam and end cases choose a window and share the arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clip or gait is special-cased; the unlooped copy at the seam is the clip's own data sampled without wrapping, not a substituted value.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the window in every case including the seam and the held tail, the zero-length answer, which caller stores it, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two sampleMotion calls and two transform folds per answer; held tails and empty windows need neither. Local work is constant in beat count, with the nonempty-window cost delegated to the clip's sampler.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one node and one instant, and coordinates no work across calls; the snapshot that calls it asks once per actor.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the unlooped clip copy at the seam is shallow and released on return.
