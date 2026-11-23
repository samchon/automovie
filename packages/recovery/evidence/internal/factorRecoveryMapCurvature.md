# src/internal/factorRecoveryMapCurvature.ts#factorRecoveryMapCurvature

## @evidence contracts/development/implementation.md#principled-implementation

Unpivoted positive point Cholesky and R_point^-T cross solves produce the camera Schur B-sum(R_cross^T R_cross), followed by positive camera Cholesky. The computed finite positive factor defines R^T R numerically, without certifying intended-Hessian accuracy or conditioning.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One in-place owner returns only a complete factor/row pair or a stage-specific optional arithmetic refusal. Its caller still owns original independent rank and whole-GN fallback before model return.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No inverse, eigenvalue shift, pivot floor, clipping, tolerance-derived rescue or second factor is attempted. Malformed shapes throw and no exception is caught as optional support.

## @evidence contracts/development/common.md#meaningful-documentation

Consumes exclusively owned upper blocks in original D-scaled units. Points eliminate before camera; fixed-row preflight proves no universal future-vector support, and ordinary actions continue throwing after model return.

## @evidence contracts/development/implementation.md#efficient-algorithms

Point/cross work O(LC), Schur O(LC^2), camera factor O(C^3), and all fixed-row whitening O(LC+C^2+E(C^2+C)) fit the owner's prepaid polynomial attempt. Input shape visits and all failed prefixes are included without refunds.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The owned blocks become factors in place and one triangular action family supplies both preflight and later actions. No duplicate full Hessian, point inverse or observation history remains.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most C^2+3L(C+3) factor entries coexist with complete/partial row copies and O(n) whitening scratch under A. Refusal returns no retained factor or partial row; support transfers one matched pair for this model.
