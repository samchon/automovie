# src/cinematics/IAutoMoviePolygonBodyCue.ts#IAutoMoviePolygonBodyCue

## @evidence contracts/development/common.md#meaningful-documentation

Documents the source clock, supported branch and the two transform frames.

## @evidence contracts/development/design.md#principled-representation

Separates a live joint-relative rotation from a release pose with an independent world displacement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares the canonical bone, quaternion and vector types. The shot owns timing and the polygon renderer owns display.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Inputs describe visual poses on an explicit clock. Anatomical limits, dynamics and collision geometry remain with their regular owners.
