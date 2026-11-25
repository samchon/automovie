# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.IScaled

## @evidence contracts/development/design.md#principled-representation

Stores upper-band symmetric P, original ordered CSR rows, topology-only factor/transpose positions and positive D/E/c transformations; Preparation admits finite matrices and preserves absent infinite bounds, while types alone cannot enforce dimensions or convexity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies matrices, intervals, penalties, scales and exact structural metadata to current readers; factor-only positions preserve each K cell's sequence and transpose positions each rhs column's sequence. One-shot solves borrow original layouts while fixed models copy only zero-bearing rows, with owner-local restoration excluded from the retained numeric core.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retains generic dimensions/duplicates without a body category; -1 remains the hard-row sentinel. Numeric core arrays and borrowed or copied original layouts stay unchanged, and exceptional products restore actual zeros instead of suppressing nonfinite propagation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the scaling equations, compression offsets, hard-weight sentinel and the purpose of each numeric member.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.IResiduals

## @evidence contracts/development/design.md#principled-representation

Separates original-unit primal/dual residuals from scaled ones and records each normalization magnitude; numeric finiteness remains a runtime solver check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains the eight values the existing termination, polishing acceptance and adaptive-rho decisions read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the same infinity norms for all dimensions and actions without invented physical tolerances or fixture-specific fields.

## @evidence contracts/development/common.md#meaningful-documentation

States every residual equation, its units and normalization, and which solver decision consumes it.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.factor

## @evidence contracts/development/implementation.md#principled-implementation

Forms the cited indirect OSQP reduced system and banded Cholesky factor; convex P and positive rho/sigma are caller premises, with the existing diagonal guard documented by HumanQuadraticCholesky.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses a persistent owner's exactly matching last adapted factor or resets canonical upper storage, adds the proximal diagonal and row products, then overwrites that system with U through one Cholesky helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every row contribution, including duplicates; original index/span admission already proves the coupling band before this reader, so its kernel removes only redundant pairwise checks, without threshold or tolerance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

An exact persistent hit compares O(m) row steps; misses assemble O(n*w+sum(k_r*k_r)) and factor O(n*w*w), using O(n*w) band storage and a reused m-entry dependency copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Preparation owns the initial factor; adaptive reuse requires exact scaled P/A pair identity, sigma and every rho value, while misses fully reset and rebuild the system. Pair identity excludes q and unit reversal; the current rhs and initial rho policy always recompute.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One-shot work owns one mutable factor; persistent work retains one adapted factor plus one polishing factor and one mutable owner, each with upper/forward layouts, rotating replaced owners independently of initial factors and public outputs.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the matrix equation, parameter roles, band failure and convex-data premise.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.substitute

## @evidence contracts/development/implementation.md#principled-implementation

Uses forward and backward triangular substitution for the supplied finite nonsingular Cholesky factor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the original two band-limited sweeps to HumanQuadraticSubstitute, shared with active polishing, into the caller's destination in the same scalar order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Solves every in-band contribution without dropping coefficients or changing precision thresholds; valid dimensions and factor remain internal caller premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n*w) time, including diagonal systems, and O(1) auxiliary storage beyond the supplied destination.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads unchanged upper/forward layouts across right-hand sides; exact copies retain original coefficients, and final x production supplies its finite flag and optional componentwise relaxation without another vector traversal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates no arrays and retains nothing; only caller-owned x and optional distinct relaxed are changed.

## @evidence contracts/development/common.md#meaningful-documentation

States the factored equation, exact layout premise, optional distinct relaxation destination, finite-output flag and mutation.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.residuals

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the cited primal Ax-z and dual Px+q+A-transpose-y infinity norms and reverses D/E/c scaling for the original-unit termination check.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the complete ordered products and norm measurement to HumanQuadraticResiduals, separating diagnostics from factorization and active polishing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every stored contribution and its ordered accumulation in computed or producer-supplied products; all original unscaled/scaled infinity norms and tolerances remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normal checks take O(Z+m+n*w); supplied products take O(m+n*w), and exact diagonal finite-x curvature replaces n*w by n. Exceptional products may visit R original entries and acquire solve-local restored rows; normal checks allocate no numeric arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared unchanged 1/(c*d[i]) values; normal checks rebuild all products and only the immediate post-polish reader reuses completed Ax and A-transpose-y for unchanged x/y/A, while Px and every residual norm are still evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Products and borrowed diagnostics belong to the solve workspace; the solver copies accepted scalar diagnostics before another check may overwrite them.

## @evidence contracts/development/common.md#meaningful-documentation

Defines both residual equations, the unit reversal and the normalization values used by termination and rho adaptation.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.infeasible

## @evidence contracts/development/implementation.md#principled-implementation

Tests the cited primal-infeasibility certificate on original-unit hard-row multiplier changes, with the support function of each possibly unbounded interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the hard-row delta and its support, unscaling only the bound selected by the current delta sign; rejects a missing separating direction, then checks its transpose product norm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Excludes soft rows because their penalties permit interval violations; keeps the existing epsilon and honest infinite-bound support behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Normal checks take O(m+Z+n) without new vectors, reusing before and transpose; exceptional multiplier changes may restore and visit R original row entries through the solve-local owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Recomputes current hard-row deltas. Exact zero adds neither support nor a new nonnegative maximum, so its norm/support work is omitted after storing it. Only the sign-selected bound is unscaled; NaN remains in the norm's original rejection path. Before is disposable, and the next check copies current multipliers before another certificate reads it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Changes only solve-local before and transpose scratch, zeroes soft-row deltas and returns a boolean without retaining data.

## @evidence contracts/development/common.md#meaningful-documentation

States the certificate inequalities, original units, soft-row exclusion and behavior for absent bounds or a zero direction.

# src/posture/HumanQuadraticBand.ts#HumanQuadraticBand.polish

## @evidence contracts/development/implementation.md#principled-implementation

Implements the cited active-set regularized KKT solve and iterative refinement; the outer solver accepts its result only when the original residual checks permit it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates active row selection, exact factor reuse and current-rhs refinement to HumanQuadraticPolish, the single numerical owner shared by one-shot and fixed-model solves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps existing delta, active-row rules and refinement count; the Cholesky diagonal guard is retained and a polish is not itself a success certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

A persistent exact active-set hit skips assembly and O(n*w*w) Cholesky; misses assemble O(n*w+sum(active k_r*k_r)), and each current-rhs refinement costs O(n*w+Z+m). Exceptional products may visit R original entries, while exact diagonal finite-x curvature takes O(n).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Requires exact scaled P/A pair identity, delta and ordered active indices for factor reuse; current q, bounds and fixed soft multipliers always rebuild the rhs. Refinement/final products remain current-iterate calculations with owner-local original zero terms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate x/z and the local multiplier vector are independent of scratch; consumed before first holds active constraint residuals and then final Ax, while the cost-rhs buffer holds final A-transpose-y only after its refinement use ends; neither buffer escapes in public state.

## @evidence contracts/development/common.md#meaningful-documentation

Describes hard and soft active rows, regularized reduction, iterative refinement, scaled outputs and outer acceptance ownership.
