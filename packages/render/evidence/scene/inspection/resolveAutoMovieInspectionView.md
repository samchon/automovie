# src/scene/inspection/resolveAutoMovieInspectionView.ts#resolveAutoMovieInspectionView

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates every view with the camera it gives, states where the bounds come from, the precedence of names, the up rule, the scale's derivation and every refusal, and shows the call.

## @evidence contracts/development/implementation.md#principled-implementation

A perspective fit is the framing owner's sphere fit, and an orthographic fit projects the eight corners of the box onto the camera's picture plane and takes the larger of the half height and the half width over the aspect, times the viewpoint's distance factor, so the box lies inside the frame by the same margin; parallel projection makes that frame's height over the pixel height the metres one pixel spans everywhere in the picture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per view form, each producing a camera and its record through one record helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 0.5 m floor is the framing owner's documented convention, the margin is the viewpoint's own distance factor, and a switch a form cannot honour is refused instead of ignored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: eight corners at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Directions are the named viewpoints' own records and the perspective fit is the framing owner's, so every host frames by one rule.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Creates one camera, which the caller owns, except for `film`, which returns the subject's camera; nothing is kept.
