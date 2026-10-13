/**
 * Where a model's geometry came from: assembled by automovie, or imported by the user.
 *
 * This gates the pipeline. A `generated` model is built by automovie's geometry phase, typically as assembled parametric primitives ({@link AutoMoviePrimitiveShape}). An `imported` model is a mesh the user supplied (glTF / VRM / FBX) and the ingest package normalized; automovie then only drives motion and expression on it, skipping geometry generation. Recording the origin as a discriminated value keeps that branch explicit rather than inferred from whether a mesh happens to be present.
 *
 * @evidence contracts/common.md#principled-implementation An explicit provenance discriminator separates generated geometry from an imported appearance; forging and viewer loading read origin and the sealed imported closure rather than guessing provenance from whether parts contain meshes.
 * @evidence contracts/common.md#clear-and-simple-design The two provenance states belong to the model, leaving primitive-versus-mesh representation on each part; a deterministic generator can therefore emit mesh geometry without becoming imported.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filename or mesh presence substitutes for provenance, and imported appearance does not acquire semantic traits without its registered deterministic proxy.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes generated and user-supplied geometry and explains the explicit generation-versus-import pipeline branch rather than implying that triangle data proves origin.
 * @author Samchon
 */
export type AutoMovieAssetOrigin =
  /** Geometry assembled by automovie's generation phase. */
  | "generated"

  /** Mesh supplied by the user (glTF / VRM / FBX), normalized by ingest. */
  | "imported";
