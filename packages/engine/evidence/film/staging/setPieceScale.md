# src/film/staging/setPieceScale.ts#setPieceScale

## @evidence contracts/development/implementation.md#principled-implementation

Maps the three authored spellings onto the per-axis scale of a `T · R · S` transform, where a uniform number is the same factor on every axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one reading of the multiplier, used by `stageScene` to validate it and by `setPieceTransform` to compose the node, so the check and the composition read one scale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No piece or model is special-cased, and an invalid axis is passed through for the staging gate to refuse rather than corrected here.

## @evidence contracts/development/common.md#meaningful-documentation

States each spelling's meaning, that a vector is returned as given, the purpose, and where validation happens.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with at most one small allocation, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one value per call and coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; a vector input is returned by reference, so the scene node shares it with the staging write, and the other spellings allocate a fresh vector.
