# src/geometry/construction/AutoMoviePeriodicCubic.ts#AutoMoviePeriodicCubic.create

## @evidence contracts/development/implementation.md#principled-implementation

Moves the existing cyclic right-hand sides, 64 Jacobi sweeps, phase reduction and literal Horner expression without changing their arithmetic order. Range reads those same computed curvatures and encloses each literal cubic with an outward Bernstein hull and a separately derived reader-rounding allowance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation owns the unchanged value closure and a lazy range closure; private interval arithmetic serves only their finite enclosure proof.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No root solver, subdivision, fitted coefficients, geometric margin, clamping or second curvature solve is used. Nonfinite proof intermediates refuse instead of inventing a finite bound. The final polynomial coefficient is not replaced by the next control value.

## @evidence contracts/development/common.md#meaningful-documentation

Gives phase/control units, existing value premises, immutable input lifetime, proof scope and explicit range failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation costs O(64m), a value read O(1), and optional range conversion O(m) with fixed work per span and constant temporary storage. No range work runs for a value-only caller.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both capabilities borrow the same controls and solved curvature array; no Jacobi sweep is repeated by a shared preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closures retain the original controls and m curvatures until their caller releases them. Interval temporaries and returned bounds have invocation lifetime; no module cache or process is acquired.
