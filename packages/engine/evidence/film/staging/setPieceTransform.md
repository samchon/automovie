# src/film/staging/setPieceTransform.ts#setPieceTransform

## @evidence contracts/development/implementation.md#principled-implementation

Reads the three authored spellings into the decomposed TRS the scene node stores, using the shared quaternion axis-angle construction for the yaw-only spelling, so every consumer composes `T · R · S` from one reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one place a set piece's rotation and scale defaults are decided; `stageScene` writes it onto the node and `setPieceMatrix` composes the matrix every prop query measures under from it, instead of each restating the fallback chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No piece or model is special-cased; the `+Z`-facing default is the staging contract's meaning of an omitted turn.

## @evidence contracts/development/common.md#meaningful-documentation

States each component's source and default, the unit and axis of `facingDeg`, the precedence and who validates it, and what the result aliases.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work: at most one axis-angle quaternion and one scale vector.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one piece per call and coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the result references the piece's own `position`, `rotation` and vector `scale` objects, so a caller that mutates the result mutates the piece.
