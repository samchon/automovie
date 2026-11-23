# src/math/quaternionFromAutoMovieBasis.ts#quaternionFromAutoMovieBasis

## @evidence contracts/development/implementation.md#principled-implementation

Trace/largest-diagonal Shepperd extraction followed by normalization recovers a rotation from caller-admitted right-handed orthonormal columns, without claiming arbitrary columns form a frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One basis conversion serves deformation and inspection frames without importing renderer matrix classes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Input columns are not orthogonalized or reflected to force a result, and no model identity changes branch selection.

## @evidence contracts/development/common.md#meaningful-documentation

States world-space local-axis columns, orthonormal/right-handed prerequisite, extraction purpose, normalized glTF quaternion and unchanged inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine entries, one selected square root and one normalization take constant work without allocating a matrix.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Column coordinates feed one extraction directly; a changed frame requires a fresh quaternion rather than a cached basis reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scalar entries and one temporary quaternion are local; the returned normalized record keeps no column references.
