# src/internal/measureRecoveryHomographyErrors.ts#measureRecoveryHomographyErrors

## @evidence contracts/development/implementation.md#principled-implementation

Each map acts on the corresponding homogeneous pixel centre; after its nonzero divide, the two Euclidean transfer distances enter a symmetric RMS. This tests the fitted 2D map without assigning material depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The homography owner supplies one admitted map and inverse; this helper only scores their bidirectional explanation of the same tentative correspondences.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No denominator floor, omitted backward direction, finite replacement for a horizon or image-dependent threshold improves support.

## @evidence contracts/development/common.md#meaningful-documentation

Defines pixel-centre maps, RMS convention, null horizon/range meaning and absence of depth authority; malformed matrix actions throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

N pairs require O(N) fixed-size actions and O(N) scalar results, with no inverse fit or factorization inside the loop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fitted inverse is reused for every pair rather than recomputed during transfer measurement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned nullable scalar results transfer to the caller; no point, map cache, image or external handle survives the synchronous call.
