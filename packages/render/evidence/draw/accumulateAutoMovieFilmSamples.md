# src/draw/accumulateAutoMovieFilmSamples.ts#accumulateAutoMovieFilmSamples

## @evidence contracts/development/implementation.md#principled-implementation

Places the scene at each planned second with the subject's own `seek`, which positions everything exactly, so no velocity estimate is needed; samples run in ascending time because springs hold their state for equal or backward times. A lens sample moves the eye on the aperture and shears the projection's third column by `−e P₀₀ / f` and `−e P₁₁ / f`, the accumulation-buffer depth-of-field construction of Haeberli and Akeley 1990, which keeps the focus plane fixed for any base projection, off-axis included. The frame's own second is placed again last.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The draw host supplies placement, view resolution and the optional per-sample wrapper through which the indirect stage measures each sample's shading; this function owns sample order, the lens camera and the final placement, and the stage owns the sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject or view is special-cased; an orthographic view draws unmoved because it has no aperture.

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the shear formula, the orthographic case, the alpha mode handed to every sample and the final placement.

## @evidence contracts/development/implementation.md#efficient-algorithms

N seeks and N stage samples for N samples, plus one seek; the lens camera is one reused object.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each frame is sampled afresh; nothing of an earlier frame is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scratch camera is the host's, reused across frames; the function retains nothing.
