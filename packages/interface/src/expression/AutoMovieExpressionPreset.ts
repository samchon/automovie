/**
 * Closed VRM 1.0 preset names for emotions, visemes and eye controls.
 *
 * A preset supplies coarse intent while ARKit channels supply fine coefficients. Visemes name mouth-shape intent; blink and look presets name eye intent. The avatar's targets or expression sink determine whether and how those names deform its appearance.
 *
 * applyExpression writes a non-neutral preset's own name and expands its explicit illustrative ARKit factor table at clamped intensity. Explicit blendshape weights then replace expanded values. Neutral alone adds no weights, while authored overrides still apply. Existing supported names reset before writes; absent morph targets remain absent and supplied sinks own external interpretation. validateExpression refuses unknown preset names.
 *
 * Reference: VRM 1.0 expressions (https://vrm.dev/en/vrm/vrm_features/).
 *
 * @evidence contracts/common.md#principled-implementation The union is the VRM 1.0 preset list verbatim; `applyExpression` maps each non-neutral preset to an authored ARKit channel table scaled by the intensity clamped to `[0, 1]`, which is an approximation for meshes without VRM preset targets rather than a mapping either standard defines.
 * @evidence contracts/common.md#clear-and-simple-design One closed union is the whole coarse vocabulary, typed into `IAutoMovieExpression.preset`; the per-preset channel table lives in the viewer that applies it, not in this type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preset is given avatar-specific handling; like the ARKit channels, the engine's runtime `Set` and the viewer's preset list are type-checked only as subsets of this union, so review alone keeps them complete.
 * @evidence contracts/common.md#meaningful-documentation States how presets relate to ARKit channels, which presets serve lip-sync, mood and eyes, how the viewer applies a preset to both target kinds and what `neutral` drives, the validator's refusal, and the upstream reference.
 */
export type AutoMovieExpressionPreset =
  // emotion
  | "neutral"
  | "happy"
  | "angry"
  | "sad"
  | "relaxed"
  | "surprised"
  // lip-sync visemes
  | "aa"
  | "ih"
  | "ou"
  | "ee"
  | "oh"
  // eyes
  | "blink"
  | "blinkLeft"
  | "blinkRight"
  | "lookUp"
  | "lookDown"
  | "lookLeft"
  | "lookRight";
