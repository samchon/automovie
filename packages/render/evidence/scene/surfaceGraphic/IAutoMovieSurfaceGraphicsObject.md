# src/scene/surfaceGraphic/IAutoMovieSurfaceGraphicsObject.ts#IAutoMovieSurfaceGraphicsObject

## @evidence contracts/development/common.md#meaningful-documentation

States the roots' names and parents, the applier's time range and refusal, and what disposal releases.

## @evidence contracts/development/design.md#principled-representation

One handle per prepared shot: its mounted roots, a per-frame applier of shot-local seconds and an idempotent release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hosts call apply before each frame and dispose when the shot is retired; tests read the roots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mutable graphic data is exposed; changing a picture means preparing the shot again.
