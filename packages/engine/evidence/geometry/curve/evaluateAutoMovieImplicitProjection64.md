# src/geometry/curve/evaluateAutoMovieImplicitProjection64.ts#evaluateAutoMovieImplicitProjection64

## @evidence contracts/development/implementation.md#principled-implementation

Applies bounded Newton continuation to F(P+a*d)=R and differentiates that same implicit equation through its analytic gradient and Hessian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only a constant-direction implicit solve and jet chain rule; field coefficients, domains, topology and canonical boundaries belong to callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nearest source point, mesh fallback, geometric clipping or finite-difference derivative replaces an unsupported or singular solve.

## @evidence contracts/development/common.md#meaningful-documentation

States physical units, constant direction, parameter units, second-derivative layout, failure effects and lack of global root qualification.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four times twelve Newton steps with eight backtracking candidates bound field queries; derivative propagation is quadratic in the caller's at most two parameters.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each accepted field jet for the next residual and the final gradient and Hessian for every parameter derivative.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Query-local vectors and arrays are bounded by two parameters; no cache, process or external resource survives the call.
