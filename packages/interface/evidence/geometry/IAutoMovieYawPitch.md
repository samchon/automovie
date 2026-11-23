# src/geometry/IAutoMovieYawPitch.ts#IAutoMovieYawPitch

## @evidence contracts/development/design.md#principled-representation

Spherical angles of the aim vector in the actor's own frame: `atan2` gives a quadrant-correct heading and a pitch measured against the horizontal length, so a target straight above or below reads ±90 without dividing by zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two angles are the whole look state of a roll-free gaze, so the record carries no vector or quaternion and the rig mapping stays in the synthesizer that owns the neck and head.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The degenerate zero-length aim answers a stated `0, 0` rather than `NaN`, and non-finite inputs are refused by `aimYawPitch` before any angle is computed.

## @evidence contracts/development/common.md#meaningful-documentation

States frame, formulas, yaw's signed branch endpoints, pitch range, angle signs, zero-aim convention, absent roll and the synthesis consumer's joint mapping.
