# src/index.ts#IAutoMovieFormationViewerStats

## @evidence contracts/development/design.md#principled-representation

Separates anonymous near/far batch-selected slots, chunk-frustum exclusions and authored removals from promoted hero selection. Counts describe viewer state, not native draw submissions or visible pixels; compiled inputs omit hero tiers from anonymous LODs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A fixed-size count record exposes runtime accounting without retaining per-member debug arrays for the host.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Hero visibility is not counted as anonymous instances; removed and off-camera members remain distinct instead of being combined to match a total.

## @evidence contracts/development/common.md#meaningful-documentation

Explains anonymous accounting, promoted hero treatment and why authored removal differs from frustum culling.
