/**
 * Where a model's geometry came from: assembled by automovie, or imported by the user.
 *
 * A `generated` model is built from an authored geometry recipe, including parametric primitives or deterministic mesh generation. An `imported` appearance comes from admitted user-supplied glTF, GLB or VRM bytes; its deterministic proxy and rig mapping have separate admission. The current ingest package implements no FBX path. Origin selects provenance independently of whether a part happens to carry triangles.
 *
 * @evidence contracts/common.md#principled-implementation An explicit provenance discriminator separates generated geometry from an imported appearance; forging and viewer loading read origin and the sealed imported closure rather than guessing provenance from whether parts contain meshes.
 * @evidence contracts/common.md#clear-and-simple-design The two provenance states belong to the model, leaving primitive-versus-mesh representation on each part; a deterministic generator can therefore emit mesh geometry without becoming imported.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filename or mesh presence substitutes for provenance, and imported appearance does not acquire semantic traits without its registered deterministic proxy.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes generated and user-supplied geometry and explains the explicit generation-versus-import pipeline branch rather than implying that triangle data proves origin.
 */
export type AutoMovieAssetOrigin =
  /** Geometry assembled by automovie's generation phase. */
  | "generated"

  /** User-supplied appearance from the supported glTF, GLB or VRM ingress. */
  | "imported";
