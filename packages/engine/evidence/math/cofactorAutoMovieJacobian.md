# src/math/cofactorAutoMovieJacobian.ts#cofactorAutoMovieJacobian

## @evidence contracts/development/implementation.md#principled-implementation

Column cross products form the cofactor matrix and their scalar triple product gives the determinant; positive finite determinant admission preserves orientation without matrix inversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mesh deformer consumes one shared determinant/cofactor pair for transported normals and face checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No determinant epsilon erases small positive maps; consumers still check transported vectors because cofactors can overflow.

## @evidence contracts/development/common.md#meaningful-documentation

States row-major dimensionless layout, oriented-area transport, determinant admission, ownership and possible cofactor overflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine checks and three fixed cross products take constant time, without iterative inversion or dimension-dependent storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same cross products supply both determinant and cofactor output, avoiding another determinant calculation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Column and cross-product records are temporary; the caller owns the returned nine-entry matrix and determinant.
