/**
 * The closed set of morph-target names behind {@link IAutoMovieFace}: the flat
 * vocabulary the nested document projects onto.
 *
 * The document is anatomy-shaped (`eyes.size`, `jaw.chin.length`), while glTF
 * morph targets are a flat name list. Paired features (eyes, brows, cheeks)
 * have one target per side, suffixed `R` or `L` for the subject's right or
 * left, so a lone side drives both targets and two stated sides each drive
 * their own: asymmetry is data, not extra geometry. The engine's `flattenFace`
 * performs the projection, and an authored template supplies one morph target
 * per name it supports.
 *
 * The engine's `morphFace` throws when a trait the document sets has no target
 * in the template or a target's delta length differs from the template's
 * positions; a template may omit names the documents it serves never set.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` maps each unsided leaf to one name and each sided leaf to an `R` and an `L` name from fixed tables, and `morphFace` applies linear blendshapes `positions + sum(weight * delta)` over exactly those names, so the union is the complete set of targets a face document can reach.
 * @evidence contracts/common.md#clear-and-simple-design A flat closed union matches the flat morph-target list of a glTF asset, and the nested anatomy grouping stays on the document, so templates and documents meet at one spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target is assumed present: a missing target for a set trait or a delta of the wrong length throws instead of being skipped, and no canonical face topology or landmark set is required of the template.
 * @evidence contracts/common.md#meaningful-documentation States the projection from document to names, the side suffix convention and lone-side rule, who supplies the targets, and exactly when `morphFace` throws.
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
