# src/posture/HumanQuadraticProgram.ts#HumanQuadraticProgram.multipliers

## @evidence contracts/development/implementation.md#principled-implementation

Transfers the unscaled Lagrange multiplier attached to each constraint key, the existing SQP warm-start correspondence; callers supply the state of this ordered problem.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass extracts keyed rows from the solved state, leaving numeric preparation and later convexification with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads actual solved multipliers; a repeated key keeps its last row by Map semantics and no action-specific mapping is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(m) time and at most one Map entry per distinct key, where m is the row count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Supplies the current multipliers for matching constraints in another convexification; it rebuilds the map because the latest solve may change every multiplier.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one caller-owned map per extraction and retains no state in the module.

## @evidence contracts/development/common.md#meaningful-documentation

Names the keyed SQP transfer, compatible-state premise, result ownership and repeated-key behavior.

# src/posture/HumanQuadraticProgram.ts#HumanQuadraticProgram.solve

## @evidence contracts/development/implementation.md#principled-implementation

Implements the cited OSQP scaled ADMM equations, unscaled residual and infeasibility tests, adaptive rho and active-set polishing for caller-supplied convex P; termination status distinguishes a residual solution from an unfinished iterate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns admitted numeric equivalence, Band owns linear algebra, and the shared HumanQuadraticSolve owns independent iterates, prox steps, termination and unscaling for this one-shot entry and prepared models.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves existing rho, sigma, relaxation, iteration and residual parameters. Nonfinite operands restore original zero terms instead of concealing IEEE-754 failures or rejecting truly empty rows; admitted inputs remain unchanged during the synchronous solve, and Band documents the unchanged diagonal guard.

## @evidence contracts/development/implementation.md#efficient-algorithms

Finite ADMM iterations take O(n*w+Z+m), with at most 4000 iterations; exceptional products may revisit R original row entries. Preparation scans original storage, while initial factors, adaptive refactors and polishing have their documented S-aware costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A one-shot solve prepares and factors its own data, sharing nothing with another call. Original-order topology positions serve current rhs contributions, each row product feeds its prox, consumed rhs/xt/before supply scratch and rho changes recompute thresholds/products. Accepted polish iterates transfer without copying; each unscale producer checks its final value before the original rejection phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Selected ADMM or accepted-polish iterates transfer independently of scratch/warm/cache data after unscaling. Thresholds, borrowed raw rows and at most R restored exceptional coefficients release with this solve, as do rejected polish data. Its preparation and initial factor are released with it; nothing is retained by a module.

## @evidence contracts/development/common.md#meaningful-documentation

Describes all OSQP stages, warm and keyed-dual inputs, convergence limits, rejection conditions, mutable output ownership and the preparation lifetime.

# src/posture/HumanQuadraticProgram.ts#HumanQuadraticProgram.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Delegates admission and modified Ruiz equilibration to the same numeric owner as one-shot solve; a copied fixed matrix defines the model while intervals remain solve inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exposes the fixed-matrix producer through the existing quadratic namespace and delegates its state and lifetime to HumanQuadraticModel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Snapshots generic numeric data without trusting mutable input identity, changing solver tolerances or retaining an answer; every call still runs OSQP on its supplied bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation takes its documented O(S+R+10*(n*w+Z+m)) miss cost or exact-match scan, then O(R+m) copying for original zero preservation and O(n+m) scratch allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed P/q/A and row order are immutable owned dependencies; the consumer supplies only current intervals, weights and keys, and rebuilds this model for a new convexification.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned model retaining its scaled matrices, copied original rows, O(n+m) scratch and at most three workspace factor owners plus its initial factor, each with upper/forward layouts; outputs and warm iterates remain independent and only discarded candidates may supply reset scratch.

## @evidence contracts/development/common.md#meaningful-documentation

States snapshot semantics, model invalidation, changing inputs, preparation failure and ownership.

# src/posture/HumanQuadraticProgram.ts#HumanQuadraticProgram.interior

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the primal-dual predictor-corrector iteration documented with its derivation at `HumanQuadraticInterior`, on the same admitted and equilibrated data as `solve`, or on the session's scales.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation; the method, its parameters, its session and its failure cases have one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A solve that misses its accuracy returns nothing instead of an approximate iterate; no row or penalty differs from `solve`'s reading of the problem.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n w^2) an iteration for n variables and band w, a bounded number of iterations; no speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the numeric preparation of `solve` for exactly equal data, and with a session its scales, scratch and last point as `HumanQuadraticInterior` states.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Without a session all scratch is released on return; a session keeps what `HumanQuadraticInteriorSession.ISession` states until its caller drops it; the returned arrays are the caller's.

## @evidence contracts/development/common.md#meaningful-documentation

States when to use it, the session, the absent result's meaning and the failure cases.

# src/posture/HumanQuadraticProgram.ts#HumanQuadraticProgram.value

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the symmetric banded quadratic objective and each soft interval's exact l1 distance; callers supply compatible admitted finite data and current finite variables, with finite-coefficient zero products known exactly at the absent-vector origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates current-x and admitted-origin calculations to HumanQuadraticValue, sharing each computed interval excess with an optional same-call model diagnostic consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves original nonzero/duplicate contribution order and every scalar association. Same-call finite x permits exact-zero omission; nonfinite x retains the full original product path. Hard rows add no objective penalty by definition, and this reader performs no admission or overflow certification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Current-x evaluation takes O(n*w+R+m), including finite-x proof, for R supplied soft entries and m rows; finite x skips exact-zero off-diagonal/row multiplications. Origin costs O(m), with O(1) auxiliary storage and no zero vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads current mutable data, sharing each row product/excess with its synchronous observer and xi/P rows within current curvature evaluation. One finite-x proof permits zero-product omission; origin products are already proved zero by admission, and no values survive across trials.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses scalar accumulators and retains no data after returning the objective value.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the quadratic and soft-penalty expression, admitted-origin mode, ordered read-only observer and compatible finite-input premise.
