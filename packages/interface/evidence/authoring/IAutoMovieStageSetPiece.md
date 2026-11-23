# src/authoring/IAutoMovieStageSetPiece.ts#IAutoMovieStageSetPiece

## @evidence contracts/development/design.md#principled-representation `stageScene` requires a unique non-blank node, a non-blank model, a finite position, a finite heading when present, never both a heading and a rotation, a finite rotation within `1e-6` of unit length, and a scale finite and positive on every axis, then lowers the rotation, or a quaternion about +Y from the heading, and the expanded scale into the node transform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A heading covers upright props and a full quaternion covers sloped or vertical architecture, so the common case needs no quaternion; scale is either one number or a per-axis vector expanded by `setPieceScale`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero scale axis is refused because it collapses volume and can leave planar geometry, and a negative axis mirrors orientation; a rotation outside the unit-norm tolerance is refused rather than normalized.

## @evidence contracts/development/common.md#meaningful-documentation

States what lowering produces, how a shot can still move the piece, the world frame and units, the heading default, the exclusivity of heading and rotation, and the scale bounds and default.
