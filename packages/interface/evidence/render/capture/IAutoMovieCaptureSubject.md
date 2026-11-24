# src/render/capture/IAutoMovieCaptureSubject.ts#IAutoMovieCaptureSubject

## @evidence contracts/development/design.md#principled-representation

The subject's clock (seconds and frames per second), its raster in pixels, its view names, its drawn objects with world boxes in metres and its mark kinds are the facts a plan is checked against; nothing about how it is drawn is held.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member is read by the planner: the clock by the times, the raster by the layout, the views and mark kinds by the refusals, the drawables by the sweep, the named instants by the captions. The optional delivery members, the intent, the sound list and the cut, are read by the delivery render, the cut as the playback timeline its owner already types. Boxes use the interface's own vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a subject kind, a film or a figure. That durations, rates and sizes are positive and boxes finite is checked by the planner at runtime.

## @evidence contracts/development/common.md#meaningful-documentation

States who fills it and when, who reads it, and each member's unit and meaning.
