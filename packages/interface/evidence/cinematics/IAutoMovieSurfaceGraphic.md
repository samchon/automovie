# src/cinematics/IAutoMovieSurfaceGraphic.ts#IAutoMovieSurfaceGraphic

## @evidence contracts/development/common.md#meaningful-documentation

States the linear colour convention and its alpha, both emission kinds with the luminance unit and range, that an emissive surface lights nothing, what a null background leaves showing and the layer draw order.

## @evidence contracts/development/design.md#principled-representation

Emission is a closed union keyed by `kind`, so a luminance exists only for a self-luminous screen; a white pixel's luminance in cd/m² ties a screen to the renderer's photometric units, and a printed graphic carries none because scene light sets its radiance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`render` reads emission, background and layers to build the meshes and materials; the engine gate checks them. Geometry and timing belong to the track and the affordance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional luminance on a printed graphic and no implicit background: `null` is stated explicitly. Colours reuse `IAutoMovieColor` instead of a new colour shape.
