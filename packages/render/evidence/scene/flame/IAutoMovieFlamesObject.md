# src/scene/flame/IAutoMovieFlamesObject.ts#IAutoMovieFlamesObject

## @evidence contracts/development/common.md#meaningful-documentation

States the meshes' names and parents, the applier's exact-time evaluation and visibility, and disposal.

## @evidence contracts/development/design.md#principled-representation

One handle per prepared shot: its meshes, a per-frame applier of shot-local seconds and an idempotent release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hosts call apply before each frame; tests read the meshes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mutable cue data is exposed.
