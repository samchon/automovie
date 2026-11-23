# src/math/createAutoMovieQuadraticConicProgram.ts#createAutoMovieQuadraticConicProgram

## @evidence contracts/development/implementation.md#principled-implementation

Ax<=u becomes Ax+s=u and Ax>=l becomes -Ax+s=-l with s>=0; equality slack is zero. These are equivalent constraints with signed original multipliers, including exact-zero and tiny coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Conic representation and row mapping have one producer; admission remains at the public adapter and equilibration at its numerical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No row, coefficient or objective term is removed; only documented infinity sentinels omit unbounded sides and initial remains a compatibility-only input.

## @evidence contracts/development/common.md#meaningful-documentation

States conic signs, equality ordering, copied inputs and mapping ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Expanded rows and entries are at most twice the originals. Assembly uses O(n+m+nnz) storage and O(nnz plus per-column entry sorting) work to retain sorted CSC rows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each mutable assembled input receives a fresh owned representation and no previous problem is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary side maps are bounded by original rows; returned arrays transfer to one solve, with no global retention or external handle.
