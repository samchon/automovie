/**
 * What one unit of a surface's texture coordinates means.
 *
 * The repository carries three coordinate sources and they are not interchangeable arithmetic. An atlas-bearing procedural surface measures its UV in local metres of surface distance, so a 2 m face spans two units before any later mesh transform and the repeat a finish wants is `1 / tile`, independent of how large the face is. A normalized authored surface, such as a lattice or a module prototype, spans `[0, 1]` over the whole surface, so the same finish wants `extent / tile` and the face's own size is part of the answer. An imported set may instead retain arbitrary source UVs. Nothing about one such unit implies a physical distance or a normalized extent; its source layout or adoption receipt owns the transform.
 *
 * Nothing in an image says which of the three it will be sampled through, and neither does a `transform.scale` read on its own: the metric and normalized arithmetics differ by exactly the surface extent, and the imported one has no general formula at all, which is why a binding authored for one and applied to another reads as flat paint or as one tile smeared across a floor rather than as a wrong number anything can see. Declaring the source is what makes that difference a stated fact instead of a guess.
 *
 * @evidence contracts/common.md#principled-implementation The three literals distinguish metric surface distance, normalized surface extent and arbitrary imported UV units; the texture-scale validator can compare only the first two against carried mesh spans.
 * @evidence contracts/common.md#clear-and-simple-design A closed union records the coordinate convention beside the texture reference instead of deriving it from image dimensions or transform magnitude.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imported source UVs retain their authored unit and are not assigned a guessed physical tile size; metric and normalized bindings use their distinct scale relationships.
 * @evidence contracts/common.md#meaningful-documentation Explains each coordinate unit, the metric and normalized repeat formulas, and why image contents or scale alone cannot establish that unit.
 * @author Samchon
 */
export type AutoMovieTextureCoordinateSource =
  | "surface-metres"
  | "normalized"
  | "source-uv";
