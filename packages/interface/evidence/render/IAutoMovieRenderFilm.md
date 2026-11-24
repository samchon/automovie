# src/render/IAutoMovieRenderFilm.ts#IAutoMovieRenderFilm

## @evidence contracts/development/design.md#principled-representation

The film stage allocates by what the optics and shading ask for, not by their values, so the most demanding second's optics and the union of its shading are exactly what a one-frame upper bound needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members reusing the draw scene's own `IAutoMovieFilmOptics` and `IAutoMovieFilmShading`; the engine's `measureAutoMovieRenderFilmStage` is the only reader and `IAutoMovieRenderSubject.film` the only holder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No per-second list is stored and no allocation is restated: the inventory derives every target from these settings and the drawing-buffer raster.

## @evidence contracts/development/common.md#meaningful-documentation

States which targets each member makes the stage allocate, what worst case the caller supplies and who reads it.
