# src/render/inspection/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera

## @evidence contracts/development/design.md#principled-representation

Eye and target use world metres; up is a dimensionless world-space unit direction. A perspective camera adds vertical field of view in degrees and an orthographic one its scale in metres per pixel; the other projection's member is null. Clip distances are in metres from the eye.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `resolveAutoMovieInspectionView` and stored by every host's capture record; `view` is the text that asked for it, so the record says both what was asked and what it became.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record holds numbers and text only, not a three.js camera, so it can be written and compared; that the null member matches the projection is kept by its producer.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is with its unit and frame, and which member is null under which projection.
