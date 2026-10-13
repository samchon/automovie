/**
 * The closed set of **VRM 1.0 expression presets**: high-level named emotions
 * and visemes.
 *
 * Where {@link AutoMovieArkitChannel} is the fine-grained 52-channel control,
 * presets are the _coarse, semantic_ control surface: a single name an LLM can
 * pick to convey an emotion or a mouth shape, which the runtime expands into
 * the underlying blendshapes. Presets retarget across every VRM avatar
 * generically (the avatar author defines how each preset deforms its own mesh),
 * making them the most portable and most LLM-reliable expression handle.
 *
 * The five `aa`/`ih`/`ou`/`ee`/`oh` visemes drive lip-sync; the emotion set
 * drives mood; `blink` and the look directions drive eyes.
 *
 * The viewer sets a preset by name on VRM expression targets, and on a plain
 * morph mesh expands it into ARKit channels through a fixed weight table scaled
 * by the expression's intensity; `neutral` drives no weight at all.
 *
 * Reference: VRM 1.0 expressions (https://vrm.dev/en/vrm/vrm_features/).
 *
 * @evidence contracts/common.md#principled-implementation The 18 VRM 1.0 preset names as a closed literal union; `applyExpression` writes the chosen name to VRM expression sinks and, for meshes that only expose morph dictionaries, multiplies intensity into the preset's row of `PRESET_CHANNELS` ARKit factors.
 * @evidence contracts/common.md#clear-and-simple-design Emotion, viseme and eye presets share one union beside the fine ARKit channels, so the common case is one name and one intensity rather than a channel vector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `neutral` is the only preset the viewer skips, and the ARKit expansion factors are fixed viewer constants rather than per-avatar tuning; `validateExpression` restates the 18 names by hand because the union is erased at runtime.
 * @evidence contracts/common.md#meaningful-documentation Groups the names into six emotions, five lip-sync visemes and seven eye controls, says how the viewer realizes a preset on VRM and plain morph meshes, and cites the VRM reference.
 * @author Samchon
 */
export type AutoMovieExpressionPreset =
  // ── emotion ──
  | "neutral"
  | "happy"
  | "angry"
  | "sad"
  | "relaxed"
  | "surprised"
  // ── lip-sync visemes ──
  | "aa"
  | "ih"
  | "ou"
  | "ee"
  | "oh"
  // ── eyes ──
  | "blink"
  | "blinkLeft"
  | "blinkRight"
  | "lookUp"
  | "lookDown"
  | "lookLeft"
  | "lookRight";
