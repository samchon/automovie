# src/internal/RecoveryChartPhysicalJet.ts#RecoveryChartPhysicalJet

## @evidence contracts/development/implementation.md#principled-implementation

Twice-projected thin QR gives K=Q R; U R^-1 converts leaf Bernstein derivatives to physical tangent derivatives without forming a UV inverse or the squared-condition Gram matrix. The source-metric equivalence assumes a nondegenerate affine PL triangle and an affine rectangular leaf map; binary64 frame error remains measured separately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure constant-size operation validates the triangle and leaf, constructs its frame and returns two scalar derivative directions with vector targets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate matching, coefficient repair, epsilon clamp, source topology publication or source-normal consumer substitutes for the declared physical derivative rows. The machine-relative QR rejection changes admission rather than silently modifying observations.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative frames, millimetre targets, positive UV orientation, reuse across clipping children, floating-point rejection, diagnostic limits and immutable ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three physical points and three UV points require O(1) arithmetic and storage; no quadrature, source traversal, solver or tessellation is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The physical QR frame and parameter conversion are computed once for both tangent rows. Callers can reuse the returned rows for every quadrature point of the same source-triangle and leaf pair; no module cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed-size local vectors expire on return or throw. Returned arrays own their values, input arrays are never retained, and the operation owns no handles or growing state.
