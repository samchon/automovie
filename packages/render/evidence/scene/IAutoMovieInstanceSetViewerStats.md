# src/scene/IAutoMovieInstanceSetViewerStats.ts#IAutoMovieInstanceSetViewerStats

## @evidence contracts/development/design.md#principled-representation

Fixed counts distinguish slots assigned to visible LOD batches, chunk-frustum exclusions and authored or seeded hidden slots. These counters describe viewer selection state rather than observed renderer submissions or visible pixels.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A small count record gives the host accounting without exposing prototype/chunk implementation state or retaining per-slot debug records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Hidden slots are not relabeled culled to make draw totals agree with a particular camera.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states which visibility cause contributes to its count and the visible tier-key meaning.
