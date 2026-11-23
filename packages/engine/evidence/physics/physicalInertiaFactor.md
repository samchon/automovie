# src/physics/physicalInertiaFactor.ts#physicalInertiaFactor

## @evidence contracts/development/implementation.md#principled-implementation

Uses exact scalar division on a coordinate whose two actual couplings are zero, and diagonally equilibrated Cholesky for coupled coordinates, solving the same upper-stored SPD system as LAPACK DPOSV. Independent-axis division avoids a square-root round trip that can spoil representable A*w+h cancellation at zero budget. Positive finite pivots admit coupled factors; no regularization repairs a failed pivot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Captures six tensor entries, factors their dimensionless correlation matrix once and exposes inverse application for airborne rates/seed columns plus direct application for momentum reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No determinant cutoff, diagonal adjustment, inverse approximation, fixture branch or physical tolerance changes admission. The unused lower triangle is a documented storage convention, not a symmetry test.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size preparation and each right-hand-side solve take constant arithmetic and storage. The seed consumer solves directly for its three rotated basis columns without materializing an inverse, and ordinary rates allocate no matrix or eigenvectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each closure captures the actual six copied tensor coordinates and their factor, shared by physical rates and tangent columns. Changing the source rows cannot alter the owned preparation, and output mutation cannot affect later solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One factor owns fixed scalar tensor and Cholesky data without a query population, source rows or callbacks. The shape-history epoch releases it with its issued instants; returned vectors are independent.

## @evidence contracts/development/common.md#meaningful-documentation

Defines authoritative upper-triangle SPD storage, direct division on exactly independent axes, diagonal equilibration otherwise, null admission failure, common-frame solve/apply units and independent vector ownership. IPrepared exposes only those two operations and no writable numerical storage.
