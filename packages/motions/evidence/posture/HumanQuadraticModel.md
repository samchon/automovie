# src/posture/HumanQuadraticModel.ts#HumanQuadraticModel.IModel

## @evidence contracts/development/design.md#principled-representation

Accepts exactly the changing interval/penalty/key portion of the original ordered rows and returns the existing unscaled state; coefficients belong to the owned snapshot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains one solve method for fixed-matrix trust-region retries and no mutation, diagnostic or global-cache controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Models arbitrary admitted convex data without action names or a cached output; source changes require an explicit new fixed model.

## @evidence contracts/development/common.md#meaningful-documentation

Defines snapshot invalidation, changing-input order and result ownership.

# src/posture/HumanQuadraticModel.ts#HumanQuadraticModel.IModel.solve

## @evidence contracts/development/implementation.md#principled-implementation

Runs the same OSQP solve against this admitted fixed P/q/A snapshot, transforming current intervals by positive E and soft weights by c/E before the unchanged ADMM, certificate and polishing stages.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The model owns fixed matrices and disposable storage; this method validates and atomically refreshes changed scalar row inputs, then delegates the sole iteration to HumanQuadraticSolve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every current key and compares exact l/u/weight values, preserving signed zeros, hard versus soft semantics and all solver constants; it computes a current step rather than returning an old answer or mutating warm input.

## @evidence contracts/development/implementation.md#efficient-algorithms

Refresh costs O(m), and a finite iteration costs O(n*w+Z+m) for w=band+1 and Z stored coefficients, with the unchanged 4000 guard; exact factor reuse skips its documented assembly/Cholesky work without rescanning fixed input storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses its own immutable preparation, its initial factor and scratch. Object.is snapshots prove unchanged scalar scaling; fixed P/A/SIGMA need a new initial factor only on a scaled row-class change. Class or weight changes invalidate initial RHO0/threshold vectors, kept distinct from adaptations. Every solve restarts that initial policy and recomputes iterates/products/residuals; only discarded candidates reset.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The model bounds scratch by O(n+m), copied zero-bearing layouts by O(R0+m), and factors by one initial plus three workspace owners with upper/forward layouts; returned x/z/y and diagnostics transfer without retention, and model collection releases its state after success or failure.

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed snapshot and row-order premises, changing bounds/weights/keys, warm and dual inputs, original-unit output/status ownership, validation failures and bounded model lifetime.

# src/posture/HumanQuadraticModel.ts#HumanQuadraticModel

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same exact-admission and modified Ruiz preparation as one-shot OSQP, then refreshes only positive-scaled bound and penalty data before the unchanged numeric solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns fixed-row copying, exact bound snapshots and scratch lifetime; changed intervals validate/scale before replacement. Scaled row classes invalidate the initial factor and step baselines, and scaled weights invalidate step baselines; Solve owns ADMM and Preparation owns matrix scaling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves ordered duplicates, all original zero coefficients, current interval validation and overflow rejection; neither the source object nor a previous answer supplies a later result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One-time preparation has its documented S/R/n/w/Z/m cost, then copies O(R0+m) raw layout for R0 entries belonging to zero-bearing rows; CSR already owns all other coefficients. Each retry refreshes O(m) scalars without another matrix scan or numeric-array allocation for bounds and scratch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Scaled P/q/A are immutable copies; current l/u/weight compare by Object.is with admitted snapshots, including signed zeros, so only changes rescale. Keys always refresh. Changed scaled classes invalidate initial factors; classes or weights invalidate initial step/threshold vectors, kept separate from adaptations so each solve restarts RHO0. Returned iterates never become scratch.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One model retains one scaled core, O(R0+m) copied zero-bearing raw rows, O(n+m) scratch and the bounded factor storage documented by Workspace; it retains no source or previous public result, and collection releases ownership.

## @evidence contracts/development/common.md#meaningful-documentation

Defines admission, source-independent numeric snapshots, changing-bound validation, scratch ownership and fresh output lifetime.
