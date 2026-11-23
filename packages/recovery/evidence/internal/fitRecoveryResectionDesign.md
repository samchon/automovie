# src/internal/fitRecoveryResectionDesign.ts#fitRecoveryResectionDesign

## @evidence contracts/development/implementation.md#principled-implementation

Cross-product ray equations give a homogeneous projective design without forming its normal matrix. Independent 3D span, eleven resolved design directions, null separation and scaled proper-rotation discrepancy qualify the initializer before any pixel scoring. The translation retains the raw camera's centroid coordinates while replacing its linear block with the same proper rotation used for world coordinates; it is not a pixel least-squares optimum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This recovery owner only initializes a world-to-camera pose; robust proposal selection and local pixel refinement remain separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No planar fallback, truth pose, singular-value floor, normalized translation or uncalibrated projective camera is exposed as a rigid pose. Failed rank or representability throws a declared resection refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States isotropic normalization and same-rotation centroid reversal, original-design rank/null gates, row-major world-to-camera output, nonplanar support boundary, unknown metric scale and conditional pixel-refinement limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

N pairs use bounded 12-column original-design SVD O(S*N*12^2), plus three-column span and rotation decompositions; explicit linear-entry limits precede designs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Centered points and calibrated rays serve normalization and the same design; one rotation-block factorization supplies scale, proper projection and discrepancy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One owned pose and scalar diagnostics return; an optional fresh caller-owned trace retains at most twelve projective coefficients, one fixed-size projected pose and stage scalars. O(N) normalized coordinates and factors expire without image, cache or external resource; no trace history is retained here.
