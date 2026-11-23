# src/index.ts#createRecoveryMapTriangularMetric

## @evidence contracts/development/implementation.md#principled-implementation

R_point and its camera cross tail precede R_camera in point-first order. R^-T physical covectors, R^-1 steps and D R^T metric covectors use exactly these arrays and original positive column scales without an inverse or full Gram matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

QR and optional Cholesky producers share triangular actions while owning their independent factor formation and support. Nullable whitening belongs to pre-return model selection; public actions throw thereafter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero pivots and nonfinite solves do not become zero directions or late GN substitutions. These actions supply no independent data rank or intended-Hessian accuracy certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Physical order is camera then points, with point-first elimination inside the factor. Inputs are owned current factors/scales whose caller has admitted dimensions and lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(LC+C^2+n) invariant finite-factor/positive-scale check precedes actions; each row adds one O(Zrow) ownership pass. GN moves its existing point-factor finite scan here rather than duplicating it. A k-point covector costs O(kC+C^2), full inverse/transpose actions O(LC+C^2), with O(n) output/scratch. Caller work envelopes include these scans, every fixed row and subsequent admitted direction/auxiliary action.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One current factor and shared original D supply all three actions and preflight, retaining the original substitution and accumulation order for GN consumers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closures retain C^2+3L(C+4) entries for original GN factors, or C^2+3L(C+3) for curvature, plus shared O(n) scales for one model. The GN transformed-right column is retained but unused by actions. Current owned factor/scale inputs stay live; borrowed row/step/covector inputs never escape. Extra fixed action shells/reference fields fit the original128 constant slots, with no numeric copies.
