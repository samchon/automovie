/**
 * What one unit of a surface's texture coordinates means.
 *
 * The repository carries three coordinate sources and they are not
 * interchangeable arithmetic. An atlas-bearing procedural surface measures its
 * UV in local metres of surface distance, so a 2 m face spans two units before
 * any later mesh transform and the repeat a finish wants is `1 / tile`,
 * independent of how large the face is. A normalized authored surface, such as
 * a lattice or a module prototype, spans `[0, 1]` over the whole surface, so the
 * same finish wants `extent / tile` and the face's own size is part of the
 * answer. An imported set may instead retain arbitrary source UVs. Nothing
 * about one such unit implies a physical distance or a normalized extent; its
 * source layout or adoption receipt owns the transform.
 *
 * Nothing in an image says which of the three it will be sampled through, and
 * neither does a `transform.scale` read on its own: the metric and normalized
 * arithmetics differ by exactly the surface extent, and the imported one has no
 * general formula at all, which is why a binding authored for one and applied
 * to another reads as flat paint or as one tile smeared across a floor rather
 * than as a wrong number anything can see. Declaring the source is what makes
 * that difference a stated fact instead of a guess.
 *
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-texture-coordinates-scale Lets a texture declare the coordinate system its scale is expressed in rather than leaving it inferred from the image.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Names the coordinate set a binding record must state alongside its coordinate transform and real scale.
 */
export type AutoMovieTextureCoordinateSource =
  | "surface-metres"
  | "normalized"
  | "source-uv";
