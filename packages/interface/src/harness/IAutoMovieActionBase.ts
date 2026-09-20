import { AutoMovieBodyRegion } from "../skeleton/AutoMovieBodyRegion";

/**
 * Fields every action shares.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieActionBase` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieActionBase` for the narrative intent utterance timing action system contract.
 */
export interface IAutoMovieActionBase {
  /**
   * The scene-node id(s) performing this action (reuse ids from staging). A
   * list applies the **same** verb to several actors in **unison** (a chorus
   * line, a crowd, synchronised dancers) instead of repeating the action per
   * actor (fewer tokens, no drift across parallel runs).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `actor` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `actor` for the narrative intent utterance timing action system contract.
   */
  actor: string | string[];

  /**
   * Seconds into the shot when it begins.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `start` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `start` for the narrative intent utterance timing action system contract.
   */
  start: number;

  /**
   * Length in seconds, or `"auto"` to let the engine pick a natural duration (a
   * stride cadence, a punch's snap, a projectile's flight time).
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `duration` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `duration` for the narrative intent utterance timing action system contract.
   */
  duration: number | "auto";

  /**
   * Loop the action's motion this many times within its span (default 1): a
   * step repeated on the count, an idle sway. Cheaper than N near-identical
   * copies.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `repeat` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `repeat` for the narrative intent utterance timing action system contract.
   */
  repeat?: number;

  /**
   * The body-region this action drives ({@link AutoMovieBodyRegion}). Actions on
   * **disjoint** regions compose concurrently (walk while waving while
   * looking); actions sharing a region sequence. Omit to let the engine infer
   * the natural mask from the verb and, for gestures, the kind: a `locomote` is
   * `fullBody` (the shipped gaits drive hips, knees, and contralateral arms, so
   * a narrower mask strips them), a `wave`/`reach` is `upperBody`, a `lookAt`
   * or `nod`/`shake` is `head`, an `emote` is `face`, and the whole-body
   * gestures (`bow`/`crouch`/`kick`/`stagger`/`jump`/`draw`) plus `react` are
   * `fullBody`. Overlap is judged on the content surviving those masks (root,
   * bones, expression), so a `fullBody` gait still layers with a disjoint
   * head-only `lookAt`. Override only when the natural mask is wrong for the
   * staging; note the engine masks the synthesized clip to the region you pick,
   * so a narrower region trims the authored motion to those bones. Camera
   * (`frame`) and `attachTo` actions ignore it.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `region` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `region` for the narrative intent utterance timing action system contract.
   */
  region?: AutoMovieBodyRegion;

  /**
   * Acknowledge a deliberate physical implausibility so the engine's
   * physical-plausibility feedback (`"warning"`-severity, see
   * {@link IAutoMovieConstraintViolation.severity}) does not re-fire on this
   * action. A free-text intent (`"defies-gravity"`, `"superhuman-impact"`,
   * `"intentional-clip"`) that marks "this is on purpose". Omit for ordinary
   * actions; the engine warns as usual and the correction loop can address it.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `physicsIntent` as the portable data boundary for the story dialogue action interaction requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `physicsIntent` for the narrative intent utterance timing action system contract.
   */
  physicsIntent?: string;
}
