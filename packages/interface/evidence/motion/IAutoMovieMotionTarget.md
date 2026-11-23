# src/motion/IAutoMovieMotionTarget.ts#IAutoMovieMotionTarget

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's meaning, the performer frame's axes and units, what a point's normal says and the defaults of an aimless drill.

## @evidence contracts/development/design.md#principled-representation

A discriminated union of the five things an action can aim at, each carrying only the data that kind needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Names a target by subject and region or point; resolving it to a position is the engine's, not this record's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the region vocabulary and the vector type instead of free strings or ad hoc coordinates.
