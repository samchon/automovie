# src/posture/HumanQuadraticTranspose.ts#HumanQuadraticTranspose

## @evidence contracts/development/implementation.md#principled-implementation

Stable counting scatter groups original CSR positions by their column, preserving each column's original row/duplicate sequence for exactly associated A-transpose products.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns topology-only column preparation for Preparation and the ADMM rhs consumer; scaled coefficients remain in CSR, and exceptional nonfinite products keep their original raw-row owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Groups exact integer columns without combining coefficients, reassociating products, sorting duplicates or omitting a stored contribution; no solver parameter or admission is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n+m+Z) time and O(n+Z) retained integers for Z CSR entries, with no temporary numeric arrays; the prefix doubles as insertion cursors and is restored before returning.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Depends only on admitted n and original CSR offsets/columns; Preparation reuses the result only after exact topology equality, independently of coefficients, q, bounds, weights and rho.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one n+1 prefix and two Z-entry integer buffers owned by the immutable numeric topology; it retains no source array, problem, iterate or intermediate cursor after the synchronous call.

## @evidence contracts/development/common.md#meaningful-documentation

Defines original contribution ordering, duplicate preservation, dimensions, coefficient indirection, exact dependency key and bounded ownership.
