# src/drawing/IAutoMovieDeriveDrawing.ts#IAutoMovieDeriveDrawing.IProps

## @evidence contracts/development/design.md#principled-representation

An environment and orthographic view bind derived page geometry to one design snapshot; the engine validates the environment, frame and annotation/dimension identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveAutoMovieDrawing uses existing environment and view contracts as its only inputs; derived content never writes back into the design.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uncomputable geometry remains an explicit gap and duplicate ids refuse instead of silently selecting one annotation.

## @evidence contracts/development/common.md#meaningful-documentation

Documents validation, derived geometry ownership, gap reporting and canonical digest meaning.
