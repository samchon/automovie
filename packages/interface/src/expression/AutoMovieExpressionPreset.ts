/**
 * Closed VRM 1.0 preset names for emotions, visemes and eye controls.
 *
 * A preset supplies coarse intent while ARKit channels supply fine
 * coefficients. Visemes name mouth-shape intent; blink and look presets name
 * eye intent. The avatar's targets or expression sink determine whether and how
 * those names deform its appearance.
 *
 * ApplyExpression writes a non-neutral preset's own name and expands its
 * explicit illustrative ARKit factor table at clamped intensity. Explicit
 * blendshape weights then replace expanded values. Neutral alone adds no
 * weights, while authored overrides still apply. Existing supported names reset
 * before writes; absent morph targets remain absent and supplied sinks own
 * external interpretation. validateExpression refuses unknown preset names.
 *
 * Reference: VRM 1.0 expressions (https://vrm.dev/en/vrm/vrm_features/).
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
