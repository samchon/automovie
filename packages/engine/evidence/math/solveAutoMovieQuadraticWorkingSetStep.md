# src/math/solveAutoMovieQuadraticWorkingSetStep.ts#solveAutoMovieQuadraticWorkingSetStep

## @evidence contracts/development/implementation.md#principled-implementation

Builds an independent constraint basis, projects the original diagonal PSD objective into its nullspace and uses QR triangular solves rather than normal equations. Exact zero-curvature descent returns a flat direction for the caller's complete-row blocker; ambiguous rank or nonrepresentable finite arithmetic returns refusal without relaxing any row or adding curvature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The working-space candidate is separate from the refinement owner's feasible state and original KKT admission; one projectDual helper serves both affine-origin and objective candidates with the same constraint basis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tiny diagonal is floored or damped, no constraint is dropped to recover rank and no failed candidate replaces the caller's feasible iterate; exact flat coordinates keep the projected preceding state when their linear term vanishes.

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged PSD semantics, QR conventions, flat continuation, refusal limits, borrowed admitted inputs and the distinction between a normal projection and a full KKT certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dense constraint and objective bases dominate cost in variables, working rows and nullity; QR factorization and triangular solves reuse each basis, while candidate projection scans each dense nullspace vector. This owner supports finite-memory dense working spaces, not unbounded full-row scalability.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One constraint basis is shared by origin projection, normal dual reconstruction and primal candidate lifting; the reduced curvature basis is built once per step, and mutable rows prevent sharing across refinement calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Dense origin, gradient, objective rows and coordinates are call-local; the returned candidate retains its basis and optional primal/dual vectors. Allocation or arithmetic refusal returns the existing result object without retaining a running solver or external handle.
