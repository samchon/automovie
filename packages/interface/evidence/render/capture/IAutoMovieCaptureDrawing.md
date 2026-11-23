# src/render/capture/IAutoMovieCaptureDrawing.ts#IAutoMovieCaptureDrawing

## @evidence contracts/development/design.md#principled-representation

The picture in the raster tools' own record, label anchors in the picture's pixels from its top-left corner, and two identities, the renderer that drew it and the camera it resolved, which `.agents/skills/visual-debugging/capture.md` asks a record to keep so an observation repeats.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the run (picture, labels) and the record (backend, camera, resolved patterns, diagnostics); drawing itself is the host's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent backend, camera or resolution is recorded as not stated, never as a guessed default, and a comparison treats an unstated backend as differing.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what the capture does with each member, the anchor frame and what an absent identity means.
