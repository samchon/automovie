/**
 * The closed set of morph names an {@link IAutoMovieHead} projects onto.
 *
 * These are identity and shape controls, not expression: head silhouette and
 * proportion, brow, eyes (including epicanthic fold and eyelid fold), nose
 * (including bridge height), mouth and lips, cheeks and cheekbones, and jaw and
 * chin. Each name stands for one additive vertex-delta morph that an authored
 * head template supplies with its own topology; a signed weight deviates from
 * the neutral template at `0`, the sign picking the direction.
 *
 * This set covers the whole head, unlike {@link AutoMovieFaceParameterName},
 * and is unsided: one name drives both sides. Neither set is the anatomical
 * component document of the separate human face editor.
 *
 * Only the engine's `flattenHead` produces these names, and no engine function
 * applies them to geometry; applying them is the template consumer's job.
 *
 * @evidence contracts/common.md#principled-implementation `flattenHead` maps every leaf of the seven anatomy groups of `IAutoMovieHead` to exactly one name here through a fixed table, so the union is the full target vocabulary of a head document.
 * @evidence contracts/common.md#clear-and-simple-design A flat closed union matches a morph template's flat target list, while the grouping that helps a model read the schema stays on the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No name is mapped to a canonical mesh or landmark set; the remaining gap is that nothing in this repository applies these names to geometry or checks a head document's ranges, which the documentation states.
 * @evidence contracts/common.md#meaningful-documentation States which features the names cover, that each is one additive morph supplied by the template, the sign convention, how this set differs from the face vocabulary, and that no engine consumer applies it.
 * @author Samchon
 */
export type AutoMovieHeadParameterName =
  // head and cranium
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
  // jaw and chin
  | "jawWidth"
  | "jawDrop"
  | "chinLength"
  | "chinWidth"
  | "chinProject";
