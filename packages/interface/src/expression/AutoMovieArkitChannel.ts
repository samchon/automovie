/**
 * The closed set of **ARKit 52 facial blendshape** channels.
 *
 * ARKit's 52 coefficients are the de-facto industry standard for facial
 * expression: Apple face tracking, MetaHuman, Ready Player Me, and NVIDIA
 * Audio2Face all target them, each in `[0, 1]`. For automovie this is the ideal
 * structured-output target: a fixed, named, normalized, _low_-dimensional
 * vector. The model picks channels from this closed menu (so an invalid channel
 * name is impossible) and assigns weights documented to `[0, 1]` (the engine
 * clamps/validates the magnitude).
 *
 * Naming follows Apple's `ARFaceAnchor.BlendShapeLocation` lowerCamelCase keys
 * verbatim, so an automovie expression maps 1:1 onto any ARKit-compatible
 * runtime.
 *
 * The union is erased at runtime, so the engine's `validateExpression` and the
 * viewer's `applyExpression` each hold their own list of these 52 names; a
 * channel added here must be added to both.
 *
 * Reference: Apple ARKit `ARFaceAnchor.blendShapes`
 * (https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapes).
 *
 * @evidence contracts/common.md#principled-implementation A string-literal union of Apple's 52 blend-shape location keys spelled verbatim, so the compiler checks a channel name and each name addresses the same morph on any ARKit-compatible rig; weights are validated to `[0, 1]` by `validateExpression` and clamped again by the viewer.
 * @evidence contracts/common.md#clear-and-simple-design One flat union grouped by comments (eyes 14, jaw 4, mouth 23, brows 5, cheeks 3, nose 2, tongue 1) rather than nested per-region types, because an expression override addresses a channel by a single name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Limitation: the runtime lists in `validateExpression` (`ARKIT_CHANNELS`) and `applyExpression` are maintained by hand and typed only for membership, so a channel added to this union and missed there would be refused by validation and never reset by the viewer.
 * @evidence contracts/common.md#meaningful-documentation Cites the Apple reference and the runtimes sharing the vocabulary, the `[0, 1]` weight convention and its enforcer, and the two runtime copies a new channel must reach.
 * @author Samchon
 */
export type AutoMovieArkitChannel =
  // ── eyes (14) ──
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
  // ── jaw (4) ──
  | "jawForward"
  | "jawLeft"
  | "jawRight"
  | "jawOpen"
  // ── mouth (23) ──
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
  // ── brows (5) ──
  | "browDownLeft"
  | "browDownRight"
  | "browInnerUp"
  | "browOuterUpLeft"
  | "browOuterUpRight"
  // ── cheeks (3) ──
  | "cheekPuff"
  | "cheekSquintLeft"
  | "cheekSquintRight"
  // ── nose (2) ──
  | "noseSneerLeft"
  | "noseSneerRight"
  // ── tongue (1) ──
  | "tongueOut";
