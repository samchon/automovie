/**
 * The closed set of ARKit's 52 facial blendshape channels.
 *
 * validateExpression checks names against the runtime channel set and requires finite weights in [0, 1]. This named coefficient vocabulary does not establish anatomical equivalence or a matching target on every avatar.
 *
 * Names follow ARFaceAnchor.BlendShapeLocation keys. applyExpression matches an existing morph name exactly first and then case-insensitively; when folded names collide, dictionary insertion order determines the fallback. Host expression sinks receive names directly and own any external mapping.
 *
 * The union is erased at runtime, so validateExpression and applyExpression keep separate name lists. A channel added here must be added to both lists; current subset typing does not prove completeness.
 *
 * Reference: Apple ARKit ARFaceAnchor.blendShapes (https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapes).
 *
 * @evidence contracts/common.md#principled-implementation The union reproduces Apple's documented 52 blend shape locations, grouped by facial region in the source, and `validateExpression` checks each authored `channel` against a runtime `Set` of the same names because a type alone cannot reject a string at runtime.
 * @evidence contracts/common.md#clear-and-simple-design A closed string union is the whole vocabulary with no wrapper or registry, and it is the only structural constraint on `IAutoMovieBlendshapeChannel.channel`, with magnitudes left to the validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel is renamed or added for a particular avatar; the remaining weakness is that the engine and viewer name lists are type-checked only as subsets of the union, so nothing but review keeps them complete when a channel is added here.
 * @evidence contracts/common.md#meaningful-documentation States the standard behind the names, the `[0, 1]` range and who enforces it, the exact or case-insensitive morph matching in the viewer, the duplicated runtime lists that must change together, and the upstream reference.
 */
export type AutoMovieArkitChannel =
  // eyes (14)
  | "eyeBlinkLeft"
  | "eyeLookDownLeft"
  | "eyeLookInLeft"
  | "eyeLookOutLeft"
  | "eyeLookUpLeft"
  | "eyeSquintLeft"
  | "eyeWideLeft"
  | "eyeBlinkRight"
  | "eyeLookDownRight"
  | "eyeLookInRight"
  | "eyeLookOutRight"
  | "eyeLookUpRight"
  | "eyeSquintRight"
  | "eyeWideRight"
  // jaw (4)
  | "jawForward"
  | "jawLeft"
  | "jawRight"
  | "jawOpen"
  // mouth (23)
  | "mouthClose"
  | "mouthFunnel"
  | "mouthPucker"
  | "mouthLeft"
  | "mouthRight"
  | "mouthSmileLeft"
  | "mouthSmileRight"
  | "mouthFrownLeft"
  | "mouthFrownRight"
  | "mouthDimpleLeft"
  | "mouthDimpleRight"
  | "mouthStretchLeft"
  | "mouthStretchRight"
  | "mouthRollLower"
  | "mouthRollUpper"
  | "mouthShrugLower"
  | "mouthShrugUpper"
  | "mouthPressLeft"
  | "mouthPressRight"
  | "mouthLowerDownLeft"
  | "mouthLowerDownRight"
  | "mouthUpperUpLeft"
  | "mouthUpperUpRight"
  // brows (5)
  | "browDownLeft"
  | "browDownRight"
  | "browInnerUp"
  | "browOuterUpLeft"
  | "browOuterUpRight"
  // cheeks (3)
  | "cheekPuff"
  | "cheekSquintLeft"
  | "cheekSquintRight"
  // nose (2)
  | "noseSneerLeft"
  | "noseSneerRight"
  // tongue (1)
  | "tongueOut";
