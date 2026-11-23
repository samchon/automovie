# src/internal/refineRecoveryCameraMap.ts#refineRecoveryCameraMap

## @evidence contracts/development/implementation.md#principled-implementation

Analytic pinhole derivatives, complete-vector soft-L1 weights and original-design point-local QR solve C=6N-7 gauge-fixed camera coordinates. Seed r*normalize(t+Bz) shares actual P_t B with the design; independent point/reduced-camera ranks precede damping and actual same-population SO3/sphere/Euclidean descent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This nonlinear owner keeps fixed population, gauge, damping and local termination together; projection and block-linear algebra have separate numerical owners, and final map qualification belongs to the coordinator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No first/second full-pose double anchoring, independent normalization of third translation, covariance claim, dropped measurement or damping-derived rank supplies a map. Nonpositive trial depths reject the step, and iteration exhaustion remains nonconverged.

## @evidence contracts/development/common.md#meaningful-documentation

States seven removed gauge freedoms, fixed known calibration, robust vector weighting, common population, 1e-8 local stops and separation of robust versus unweighted squared cost. Explicit internal lagged-curvature options reach only the feasible owner; its GN-first fit-local multiplier seed and adaptive agreement restart independently per call. Public schemas and default method selection are unchanged; both map methods use the current-radius chart and its added resource costs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary E-observation, L-landmark, C=6N-7 camera refinement costs O(I*(E*C^2+S*C^3)). Current-radius differentiation prepays512 extra visits per ordinary design evaluation or feasible model and256 per seed trial in both paths. Feasible selection adds whitening, gates and sparse passes. Optional factors cost O(S*(q+H)*H^2+q*H^2); adaptive agreement and lagged geometry/factor/whitening retain separate envelopes without additional nonlinear trials. No dense all-point Jacobian is formed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each current projection supplies residual, robust weight and both point/camera derivatives. Fixed features, intrinsics and measurements are reused across iterations; only changed numerical poses/points are reevaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

New pose/landmark arrays and plain reports transfer. Feasible selection admits four candidates and exact increments beside current/checkpoints and factors. Adaptive design and lagged F/S/A reservations are separately admitted; old/new owned duals reset per fit, partial/unused factors expire before direction work, and no borrowed reaction argument or numeric history escapes. Ordinary calls allocate none of the optional curvature or coherent feasible-report state. Feasible calls borrow one reporting scope or admit a direct512 envelope; encoded/raw/previous/trace reporting overlap stays separate from numerical factors.
