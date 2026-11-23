# src/posture/HumanQuadraticSolve.ts#HumanQuadraticSolve

## @evidence contracts/development/implementation.md#principled-implementation

Runs Stellato et al. 2020 OSQP scaled ADMM, original-unit residual/certificate checks, adaptive rho and active-set polish on the admitted convex program.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one iteration shared by public solve and fixed-matrix models; Preparation owns admission/scaling/topology, while finite rhs products gather by column in original contribution order and exceptional products retain the original row owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every rho, sigma, relaxation, iteration, residual, certificate and polishing parameter. Column gathers retain each variable's original row/duplicate product sequence and scalar association; nonfinite row multipliers restore the original raw zero terms rather than using the compressed fast path.

## @evidence contracts/development/implementation.md#efficient-algorithms

With w=band+1 and Z compressed row entries, each finite iteration costs O(n*w+Z+m), at most 4000. Its rhs writes each variable once; initial/adapted row production computes u+t/l-t once per rho epoch, avoiding those repeated soft-prox additions without another row pass. Factorization/polishing retain documented costs; runtime speed is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Model invalidates initial factors on scaled-class changes and RHO0/threshold baselines on class/weight changes; adaptations overwrite a distinct pair, so every solve restarts initial policy. Initial row production emits current rhs/finite status and threshold-shifted soft bounds; adaptation refreshes those cuts with steps, and each prox emits its next rhs proof. Backward solves emit finite status/relaxation, residuals recompute and previous y copies only at certificate checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One-shot scratch releases on return or throw; optional memory belongs to one fixed model, retaining at most one discarded candidate triple. Selected unscaled x/z/y and diagnostics transfer independently, never remaining in scratch or mutating warm input.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted data premise, shared numeric ownership, optional scratch lifetime and independently owned outputs.
