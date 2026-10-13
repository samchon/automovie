/**
 * The closed set of **morph-target names** behind {@link IAutoMovieFace}: the
 * flat vocabulary the nested document projects onto.
 *
 * The document is anatomy-shaped (`eyes.size`, `jaw.chin.length`); glTF morph
 * targets are a flat name list. Paired features (eyes, brows, cheeks) carry one
 * target PER SIDE (`R`/`L` suffixes for the subject's right/left) so a shared
 * document value drives both targets and a `left`/`right` override adjusts one:
 * asymmetry is data, not extra geometry. The engine's `flattenFace` performs
 * the projection. An authored template supplies one morph target per supported
 * name; the engine applies these weights without selecting a canonical person
 * or requiring a landmark topology. The set is
 * deliberately low-dimensional and human-readable, the same design bet as
 * {@link AutoMovieArkitChannel} for expression, applied to face _shape_.
 *
 * `morphFace` throws only when a trait the document sets has no target; a
 * template may omit names the documents it serves never set.
 *
 * @author Samchon
 */
export type AutoMovieFaceParameterName =
  | "faceWidth"
  | "faceLength"
  | "cheekFullnessR"
  | "cheekFullnessL"
  | "jawWidth"
  | "chinLength"
  | "chinProtrusion"
  | "eyeSizeR"
  | "eyeSizeL"
  | "eyeWidthR"
  | "eyeWidthL"
  | "eyeSpacingR"
  | "eyeSpacingL"
  | "eyeHeightR"
  | "eyeHeightL"
  | "eyeTiltR"
  | "eyeTiltL"
  | "browHeightR"
  | "browHeightL"
  | "noseLength"
  | "noseWidth"
  | "noseProjection"
  | "mouthWidth"
  | "mouthHeight"
  | "lipFullness";
