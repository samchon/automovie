# src/geometry/construction/AutoMovieIllinois.ts#AutoMovieIllinois

## @evidence contracts/development/common.md#meaningful-documentation

States the bracket premise, the halving rule and the stop condition.

## @evidence contracts/development/design.md#principled-representation

The Illinois rule halves the residual weight of the end kept twice in a row. The owner accepts scalar roots or evaluated trials on the same bracket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing scalar callers use `root`. Head calibration uses `select` to carry an actual evaluated member into the next source operation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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

# src/geometry/construction/AutoMovieIllinois.ts#AutoMovieIllinois.select

## @evidence contracts/development/common.md#meaningful-documentation

Takes explicit evaluated endpoints with their scalar parameters and separates trial construction from reading its residual.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the Illinois weights and retains the evaluated trial that produced the selected residual.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar root uses the same implementation with the parameter as its trial. A structured caller supplies the residual projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A sign failure returns null. An exact endpoint zero selects that endpoint. On iteration exhaustion the last trial carries no tolerance certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads both endpoint residuals and constructs at most one new trial per requested iteration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Carries both active endpoint trials with their scalar parameters and residual weights. An interpolation rounded exactly to an active endpoint reads that same trial, and the scalar wrapper still calls its residual at the rounded parameter. The selected trial returns directly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the current bracket, its two trials and the selected member during the call.
