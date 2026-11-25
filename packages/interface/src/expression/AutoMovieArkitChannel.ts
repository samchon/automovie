/**
 * The closed set of ARKit's 52 facial blendshape channels.
 *
 * ValidateExpression checks names against the runtime channel set and requires
 * finite weights in [0, 1]. This named coefficient vocabulary does not
 * establish anatomical equivalence or a matching target on every avatar.
 *
 * Names follow ARFaceAnchor.BlendShapeLocation keys. applyExpression matches an
 * existing morph name exactly first and then case-insensitively; when folded
 * names collide, dictionary insertion order determines the fallback. Host
 * expression sinks receive names directly and own any external mapping.
 *
 * The union is erased at runtime, so validateExpression and applyExpression
 * keep separate name lists. A channel added here must be added to both lists;
 * current subset typing does not prove completeness.
 *
 * Reference: Apple ARKit ARFaceAnchor.blendShapes
 * (https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapes).
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
