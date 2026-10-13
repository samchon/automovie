/**
 * The closed set of **morph names** that {@link IAutoMovieHead} projects onto.
 * An authored head template owns its topology and supplies the target deltas.
 *
 * These are the comprehensive identity/shape controls (not expression): head
 * silhouette and proportion, brow, eyes (incl. the East-Asian epicanthus and
 * eyelid-fold controls), nose (incl. bridge height), mouth/lips, cheek/malar,
 * and jaw/chin. Each name maps to one additive vertex-delta morph; a signed
 * weight deviates from the neutral average (`0`), the sign picking direction.
 *
 * Distinct from {@link AutoMovieFaceParameterName}, which is the legacy
 * facial vocabulary; this set includes full-head shape. Neither is the
 * anatomical component document interpreted by the separate human face editor.
 *
 * In this repository only the engine's `flattenHead` produces these names; no
 * engine function applies them to geometry.
 *
 * @evidence contracts/common.md#principled-implementation A closed literal union of 41 morph names; `flattenHead` maps each `IAutoMovieHead` leaf to exactly one of them through a per-group field table, and the authored template's additive deltas decide what each name moves.
 * @evidence contracts/common.md#clear-and-simple-design Kept apart from `AutoMovieFaceParameterName` because it covers cranium and full-head shape symmetrically, without side suffixes, and names a different template set even where a spelling such as `faceWidth` coincides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A retained compatibility vocabulary: in-repo code only emits these names, nothing applies them to vertices, and no validator range-checks the weights that feed them.
 * @evidence contracts/common.md#meaningful-documentation Lists the covered regions, the additive-delta model and sign convention, how it differs from the face vocabulary and the human face editor, and that only `flattenHead` produces it here.
 * @author Samchon
 */
export type AutoMovieHeadParameterName =
  // head / cranium
  | "faceWidth"
  | "faceLength"
  | "faceOval"
  | "headRound"
  | "foreheadSlope"
  | "foreheadHeight"
  | "foreheadBulge"
  | "templeWidth"
  | "occiputDepth"
  // brow
  | "browHeight"
  | "browAngle"
  // eyes
  | "eyeSize"
  | "eyeHeight"
  | "eyeSpacing"
  | "eyeAngle"
  | "eyeDepth"
  | "epicanthus"
  | "eyeFold"
  // nose
  | "noseWidth"
  | "noseLength"
  | "noseProject"
  | "noseHump"
  | "nosePoint"
  | "nostrilWidth"
  | "noseBaseH"
  | "noseBridge"
  // mouth
  | "mouthWidth"
  | "lipFull"
  | "upperLipH"
  | "lowerLipH"
  | "cupidsBow"
  | "philtrum"
  | "mouthHeight"
  | "mouthSmile"
  // cheek
  | "cheekFull"
  | "cheekBones"
  // jaw / chin
  | "jawWidth"
  | "jawDrop"
  | "chinLength"
  | "chinWidth"
  | "chinProject";
