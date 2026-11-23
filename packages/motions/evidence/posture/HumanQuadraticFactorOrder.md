# src/posture/HumanQuadraticFactorOrder.ts#HumanQuadraticFactorOrder

## @evidence contracts/development/implementation.md#principled-implementation

A symmetric row outer product assigns K(i,j) only from a entries at i and b entries at j. Stable column/original-position order preserves each cell's scalar accumulation order while omitting only lower-triangle pairs; original zero restoration stays with Row.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns factor-only index preparation for Preparation and Row; original CSR columns and values remain untouched for every ordered dot product and exceptional raw-row traversal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Orders by exact integer columns with original position as an explicit tie-break, preserving unsorted duplicates without coefficient merging, reassociation, tolerance changes or changed ADMM row order.

## @evidence contracts/development/implementation.md#efficient-algorithms

For Zu entries in unordered rows of lengths k_r, costs O(m+Zu+sum(k_r log k_r)) time and O(m+Zu) retained integers. Already ordered rows allocate no per-row ordering, and one topology preparation serves repeated factors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Metadata depends only on admitted row offsets and column sequence; Preparation reuses it only with exact matching topology, independently of changed coefficients, q, bounds or rho.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one prefix and one position buffer, at most m+1 and Z entries respectively; temporary sorting views release after the synchronous call, and the numeric core owns the returned metadata until collection.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the factor-only role, per-cell arithmetic-order proof, duplicate tie-break, original CSR preservation, dimensions and ownership.
