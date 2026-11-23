# src/recovery/IAutoMovieRecoveryCameraSceneInput.ts#IAutoMovieRecoveryCameraSceneInput

## @evidence contracts/development/design.md#principled-representation

Existing fixed RGB/calibration, seed policy and separate pixel-reprojection map policy remain unchanged; the scene budget bounds incremental registration and full global track admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A separate versioned scene schema preserves the exact-three-view map contract while reusing its established image and numerical inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reference poses, authored feature tracks, filename trajectory, learned completion or implicit physical scale enters this automatic scene input.

## @evidence contracts/development/common.md#meaningful-documentation

States explicit seed ordering, candidate-set semantics, stable borrowed pixels, caller premises and separate repeated-work ceilings.
