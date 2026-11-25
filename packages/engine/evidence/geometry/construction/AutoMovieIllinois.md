# src/geometry/construction/AutoMovieIllinois.ts#AutoMovieIllinois.root

## @evidence contracts/development/implementation.md#principled-implementation

Uses the Illinois false-position update on a continuous sign-changing bracket; the girth caller supplies a monotone residual, and sign products/interpolation assume representable intermediate arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two endpoints, their stored residuals and the retained-side flag contain the entire iteration state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact endpoint zeros return directly, a failed sign-product check returns null, and exhausting the bound returns the last estimate without a convergence certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States residual tolerance, endpoint admission and the iteration-limit return; it does not promise the tolerance is met on exhaustion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates two endpoint residuals and at most one residual per requested iteration, using constant working storage in addition to f's cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses retained endpoint residuals and applies Illinois weighting instead of reevaluating those endpoints; f's effects are not shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only scalar iteration state and the supplied callback during the synchronous call; no task or cache survives return or a thrown callback.
