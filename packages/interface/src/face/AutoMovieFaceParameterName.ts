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
 * @evidence contracts/common.md#principled-implementation A closed literal union with one name per morph target; `flattenFace` maps every document leaf to one name through its `SINGLE` and `PAIRED` tables, giving the eye, brow and cheek traits an `R` and an `L` target so a lone side can drive both and asymmetry needs no extra geometry.
 * @evidence contracts/common.md#clear-and-simple-design Flat names because glTF morph targets are a flat list, while the anatomical nesting stays in `IAutoMovieFace` and the projection between the two lives once in `flattenFace`, shared by validation and morphing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compiler keeps the `flattenFace` tables inside this union but not the reverse, so a name added here without a table entry is never produced; nothing checks that a template supplies every name, only that a set trait finds its target.
 * @evidence contracts/common.md#meaningful-documentation Explains the subject-side `R` and `L` suffix convention, which function performs the projection, what a template must supply, and when a missing target fails.
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
