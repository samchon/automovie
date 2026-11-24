# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.IMemory

## @evidence contracts/development/design.md#principled-representation

Stores the read-only initial factor, initial-policy rho/threshold baselines, optional distinct adaptations, current soft threshold-shifted bounds, prox-emitted rho*z-y and n/m work. Changed scaled classes invalidate factor/baselines; weights invalidate baselines, and current-bound production/adaptation overwrites every used soft cut before reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains initial-factor/configuration ownership and disposable arrays consumed by HumanQuadraticSolve; Model owns exact class/weight invalidation, initial/adapted row production owns current soft cuts, and adaptation/polishing retain separate numeric storage/factors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retains no public solution, solved status or approximate answer key; each solve selects the RHO0 baseline, never an earlier adaptation. Only exactly unchanged scaled classes/weights permit baseline reuse; discarded candidates reset and current products recompute.

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed dimensions, initial-factor and baseline dependencies/invalidation, separate adaptive overwrite discipline, model ownership and independence from returned state.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.IWork

## @evidence contracts/development/design.md#principled-representation

Represents disposable transpose, curvature and row products plus scaled/unscaled diagnostics; compatible n/m lengths and nonaliasing are solver-owned premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains only buffers and exact adaptive/polishing factor dependencies consumed by current residual, certificate and reduced-system phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the owning Band residual type and stores no solution or approximate key; copied rho only proves factor equivalence and never supplies another solve's initial steps, while active-set and delta comparisons are exact.

## @evidence contracts/development/common.md#meaningful-documentation

States buffer sizes, nonaliasing, borrowed residual lifetime and each phase's use of the vectors.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.IAdaptive

## @evidence contracts/development/design.md#principled-representation

Couples exactly shared scaled P/A identity, copied positive row rho and sigma with the factor of P plus sigma I plus A-transpose diag(rho) A; current q and units do not enter this matrix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Records only the latest adapted system's dependencies and owned band; initial factors remain with Preparation and polishing has its distinct active-set key.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses exact numeric vector comparisons without adapting from a previous solve's rho or substituting an old iterate.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the reduced-system dependency key, one-entry bound and immutable factor ownership.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.IPolish

## @evidence contracts/development/design.md#principled-representation

Couples the canonical factor with exact scaled P/A pair identity, positive regularization and ordered active rows; private curvature-array identity is shared only after full P/A equality with compatible dimensions and topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stores only dependencies needed by the existing polishing reduced system; row bounds, multipliers and candidate iterates are not factor dependencies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Compares every active row and the exact delta, without approximate numeric keys or reusing a candidate solution.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the matrix equivalence key, independent right-hand side and owned immutable factor lifetime.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.IFactor

## @evidence contracts/development/design.md#principled-representation

Stores a canonical upper band transitioning from K to U with K=U-transpose-U and one packed forward mirror with exact numeric row prefixes; dimensions fix every offset and the matching Cholesky pass overwrites all mirrored coefficients.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies one system/factor owner and its dimensions to assembly, Cholesky and substitution; forward copies serve repeated ADMM/polish right-hand sides without recomputing or transposing coefficients per solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps mutable factorization storage separate from prepared immutable matrices and cached initial factors; no iterate or body state is stored.

## @evidence contracts/development/common.md#meaningful-documentation

Defines row lengths, dimensions, numeric ownership and the distinction from immutable prepared factors.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace

## @evidence contracts/development/implementation.md#principled-implementation

Reuses buffers only after ADMM consumes their current values; each subsequent phase resets or completely overwrites the values before reading them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Names the existing scratch roles once and leaves matrix operations and convergence policy with their current owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no shared mutable result, matrix identity cache, numerical cutoff or changed solver decision.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and object storage, referencing existing n-entry and m-entry arrays without allocating new numeric arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller supplies distinct rhs/xt/before arrays; ADMM's certificate may consume before until ADMM ends, then active polishing residuals use its initialized prefix before final Ax overwrites every entry for the immediate unchanged-x/y/A check; output state stays separate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the workspace and one fixed-size diagnostic object; a one-shot solve releases it at completion, while a fixed model retains bounded scratch until collection and never aliases returned iterates.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the phase boundary, borrowed buffers, diagnostic lifetime and absence of numeric-vector allocation.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.system

## @evidence contracts/development/implementation.md#principled-implementation

Copies each current in-range P row then adds its original proximal diagonal in row order; zero-valued contributions and signed zeros are retained while mathematically absent padding is omitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one allocation and regularized reset for both systems, copying each admitted canonical row with TypedArray.set then adding its diagonal before Cholesky overwrites that band with its factor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no coefficient, arithmetic association or regularization; original supplied padding remains validated and compared by Preparation before this internal reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

With w=band+1, reset costs O(n*w); first use allocates n upper rows and one packed forward buffer of at most n*w coefficients plus n+1 numeric offsets. Matching later uses allocate no arrays, and Cholesky overwrites every forward coefficient.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses only storage for equal n/band and recopies P plus the current diagonal on every call; changed curvature, regularization, rho and active rows are rebuilt rather than treated as a valid old factor.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A persistent workspace retains at most one mutable factor owner plus one read-only adaptive and one read-only polishing factor, each with upper/forward layouts, rotating replaced owners into mutable storage; one-shot work keeps one owner, and calls without work create a separately owned immutable initial factor.

## @evidence contracts/development/common.md#meaningful-documentation

States canonical shapes, complete P reset, shape invalidation and separate initial-factor versus solve-local ownership.

# src/posture/HumanQuadraticWorkspace.ts#HumanQuadraticWorkspace.curvature

## @evidence contracts/development/implementation.md#principled-implementation

Multiplies symmetric P with its original ordered contributions; for finite x, omitted exact-zero terms contribute only signed zeros to positive-zero accumulators, leaving the same sums. Nonfinite x retains the original full traversal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One overwrite operation serves residual and polishing products, selecting direct positive-zero diagonal emission, ordered sparse-position scatter or unchanged full-band traversal from prepared structure and current x finiteness.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Omits only exact off-diagonal zeros for finite x, preserving positive-zero initialization and each diagonal addition; a nonfinite x resets scratch and uses the original full traversal so zero-times-infinity/NaN still reaches the existing residual rejection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Finite x costs O(n) for diagonal P or O(n+K) for K recorded sparse off-diagonal positions; other cases cost O(n*w). Uses O(1) auxiliary storage beyond out and ignores supplied padding outside the canonical band.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Preparation records exact diagonal/sparse structure with its immutable core; every current x product rebuilds. Diagonal emission writes 0+Pii*xi directly without a separate zero fill, current finite-x proof avoids another scan, and absent proof is checked locally before compression. Nonfinite x retains original zero terms; band zero already has none off diagonal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates no arrays, changes only out and retains no input after the call.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the scaled symmetric product, nonaliasing premise, reset and preserved accumulation order.
