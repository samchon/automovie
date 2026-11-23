# src/math/polynomialUnitRoots.ts#polynomialUnitRoots

## @evidence contracts/development/common.md#meaningful-documentation

Coefficients are finite and ascending by power; the result contains distinct represented roots from zero through one, including endpoints.

## @evidence contracts/development/implementation.md#principled-implementation

Recursively isolates derivative roots, which partition a polynomial into monotone intervals, then bisects every sign-changing interval to machine resolution. Stationary zeros and interval ends are checked directly. This is floating-point root isolation, not a validated interval certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Normalize coefficients, find derivative cuts, inspect cuts and bisect monotone sign changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No root tolerance, guessed grid or iteration cap replaces sign bracketing; zero leading coefficients reduce the degree exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Intended for the quadratic/cubic extrema factors of paired dense polynomials; work grows with polynomial degree and the binary refinements needed to distinguish adjacent doubles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Derivative roots partition all intervals once, and normalized Horner evaluation serves every bracket.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns degree-sized coefficient, cut and root arrays only during recursion; fresh root values escape with no callback, model or global cache.
