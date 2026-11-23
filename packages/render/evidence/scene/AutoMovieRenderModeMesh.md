# src/scene/AutoMovieRenderModeMesh.ts#AutoMovieRenderModeMesh

## @evidence contracts/development/design.md#principled-representation

A Three mesh intersection exposes the single-or-array material slot that collectAutoMovieRenderModeMeshes observes before pass overrides; geometry and transforms keep the underlying mesh representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pass helpers share one material-bearing mesh projection instead of repeating casts for each supported render mode.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The projection describes ordinary mesh state and contains no special render-mode result or fixture identity.

## @evidence contracts/development/common.md#meaningful-documentation

States that this mesh projection carries either one material or a material group while an inspection pass overrides it.
