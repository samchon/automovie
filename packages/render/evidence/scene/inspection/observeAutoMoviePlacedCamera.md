# src/scene/inspection/observeAutoMoviePlacedCamera.ts#observeAutoMoviePlacedCamera

## @evidence contracts/development/implementation.md#principled-implementation

Bounds exclusion yields a confirmed framing error. A subject in frame whose drawn surface reaches in front of the near plane is cut open in the picture; on an opaque stock surface that is a confirmed error, witnessed on the near plane where the cut shows. Exact pixel counts from the host renderer confirm the authored coverage limit. Sparse ray witnesses can suggest occlusion but never satisfy a pixel obligation. A side crossing is a warning under its own optional check, because a frame edge often cuts a subject by intent: confirmed on an opaque drawn surface, a candidate from a transparent surface, an envelope, a deferred check or bounds that cross a side only before the near plane, which list the side without an extent or rank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The host mode decides the budgets once; framing, near clip, frame edge and occlusion each emit their own coverage row, and each open row's status names its cause: a budget or missing renderer defers, an uncheckable subject is unsupported.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No budget applies in capture or delivery, so a dense subject cannot leave a required check open there; the Viewer's caps are named per-frame constants for interactivity, not tuned to a scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

The Viewer runs no raster pass and divides its per-frame triangle caps among the distinct requirements. Capture and delivery cost one pixel audit per requirement with an authored ratio and near-clip work only for meshes reaching in front of the near plane. The frame-edge surface check runs only for a subject whose bounds cross a side beyond the near plane and spends what the near clip left of its triangle allowance, so one cap bounds both.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each sample observes its own placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain rows; the pixel audit restores and releases what it borrows.

## @evidence contracts/development/common.md#meaningful-documentation

Names the original camera source, the per-host budgets, obligation scope, the non-blocking frame-edge warning, confidence boundaries and what each open status means.
