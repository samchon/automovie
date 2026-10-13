/**
 * The closed set of VRM 1.0 expression presets: named emotions, visemes and
 * eye controls.
 *
 * Where {@link AutoMovieArkitChannel} is the fine-grained 52-channel control,
 * a preset is the coarse semantic handle: one name conveys an emotion or a
 * mouth shape, and each VRM avatar's author defines how that preset deforms
 * their own mesh, so a preset retargets across avatars. The `aa`, `ih`, `ou`,
 * `ee` and `oh` visemes drive lip-sync, the emotions drive mood, and `blink`
 * and the look directions drive the eyes.
 *
 * The viewer's `applyExpression` sets the preset's own name to the clamped
 * intensity and also expands it into ARKit channels through a fixed weight
 * table scaled by that intensity, taking the larger weight where they overlap,
 * so the same expression drives VRM expression targets and plain morph meshes.
 * `neutral` drives no weight at all. The engine's `validateExpression` refuses
 * any name outside this union.
 *
 * Reference: VRM 1.0 expressions (https://vrm.dev/en/vrm/vrm_features/).
 *
 * @evidence contracts/common.md#principled-implementation The union is the VRM 1.0 preset list verbatim; `applyExpression` maps each non-neutral preset to an authored ARKit channel table scaled by the intensity clamped to `[0, 1]`, which is an approximation for meshes without VRM preset targets rather than a mapping either standard defines.
 * @evidence contracts/common.md#clear-and-simple-design One closed union is the whole coarse vocabulary, typed into `IAutoMovieExpression.preset`; the per-preset channel table lives in the viewer that applies it, not in this type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preset is given avatar-specific handling; like the ARKit channels, the engine's runtime `Set` and the viewer's preset list are type-checked only as subsets of this union, so review alone keeps them complete.
 * @evidence contracts/common.md#meaningful-documentation States how presets relate to ARKit channels, which presets serve lip-sync, mood and eyes, how the viewer applies a preset to both target kinds and what `neutral` drives, the validator's refusal, and the upstream reference.
 * @author Samchon
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
