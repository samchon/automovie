# src/cinematics/IAutoMovieSurfaceGraphicTrack.ts#IAutoMovieSurfaceGraphicTrack

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives the staging target, reading axes, physical size and shot-local key bounds. It distinguishes fixed surfaces and rigid articular carriers and names admission refusals.

## @evidence contracts/development/design.md#principled-representation

A track addresses one model surface through a placed node and an affordance identifier. Engine admission resolves its dimensions and carrier. Ordered shot-local keys then select pictures independently of the rigid part's world pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The track addresses the staged node and its existing affordance. The model owns the reading frame. The graphic owns its pixels and light response.

# src/cinematics/IAutoMovieSurfaceGraphicTrack.ts#IAutoMovieSurfaceGraphicTrack.node

## @evidence contracts/development/common.md#meaningful-documentation

The id identifies the staged prop node whose model carries the graphic.

# src/cinematics/IAutoMovieSurfaceGraphicTrack.ts#IAutoMovieSurfaceGraphicTrack.surface

## @evidence contracts/development/common.md#meaningful-documentation

The id selects a sized `surface` affordance. A moving surface needs an admitted rigid carrier.

# src/cinematics/IAutoMovieSurfaceGraphicTrack.ts#IAutoMovieSurfaceGraphicTrack.keys

## @evidence contracts/development/common.md#meaningful-documentation

The nonempty keys use strictly increasing shot-local seconds starting at zero. Each picture persists until the next key or the shot end.
