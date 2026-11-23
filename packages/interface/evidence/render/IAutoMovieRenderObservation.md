# src/render/IAutoMovieRenderObservation.ts#IAutoMovieRenderObservation

## @evidence contracts/development/design.md#principled-representation

The viewer frame observer brackets a caller-supplied synchronous complete draw with renderer.info reset disabled and reports renderer-confirmed calls and triangles after culling, layers, groups and draw ranges; other dimensions currently remain null. Asynchronous completion is outside that observer, and the record itself establishes neither provenance nor a wired capture audit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nullable measurements distinguish observed facts from unsupported per-frame statistics, leaving budget selection and inventory-bound comparison to the render audit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scene membership and process-wide allocation counts cannot substitute for post-culling frame observations; null is unchecked rather than zero agreement.

## @evidence contracts/development/common.md#meaningful-documentation

Defines already-drawn-frame measurements, nullable unreported dimensions and separation from budget verdicts and preflight estimates.
