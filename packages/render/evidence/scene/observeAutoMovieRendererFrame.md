# src/scene/observeAutoMovieRendererFrame.ts#observeAutoMovieRendererFrame

## @evidence contracts/development/implementation.md#principled-implementation

Resets actual renderer submission counters once, disables automatic per-render reset and immediately samples calls/triangles after the supplied synchronous frame draw, restoring its original autoReset flag in finally.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Submission observation stays separate from geometry budget estimates and draw ownership; unobservable post-culling dimensions remain explicitly null.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scene traversal is not substituted for submitted work, counters are not claimed as pixels or GPU allocations and asynchronous draw completion is outside this immediate sampling contract.

## @evidence contracts/development/common.md#meaningful-documentation

Documents frame-wide multi-draw aggregation, nullable dimensions, live writable SDK-info premise and draw-failure/reset restoration; prior counters are intentionally replaced rather than restored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Coordinator work is fixed around the actual draw and counter reads, allocating one small record without an extra scene or pixel scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One counter-reset epoch aggregates every synchronous source/composite draw in the requested frame; another frame must reset anew and cannot reuse older submission counts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The renderer is borrowed, no GPU owner is acquired and autoReset is restored after reset/draw completion or failure; caller must keep the SDK info object live and writable throughout the scope.
