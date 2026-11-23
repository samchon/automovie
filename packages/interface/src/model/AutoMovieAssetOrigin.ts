/**
 * Where a model's geometry came from: assembled by automovie, or imported by
 * the user.
 *
 * A `generated` model is built from an authored geometry recipe, including
 * parametric primitives or deterministic mesh generation. An `imported`
 * appearance comes from admitted user-supplied glTF, GLB or VRM bytes; its
 * deterministic proxy and rig mapping have separate admission. The current
 * ingest package implements no FBX path. Origin selects provenance
 * independently of whether a part happens to carry triangles.
 */
export type AutoMovieAssetOrigin =
  /** Geometry assembled by automovie's generation phase. */
  | "generated"

  /** User-supplied appearance from the supported glTF, GLB or VRM ingress. */
  | "imported";
