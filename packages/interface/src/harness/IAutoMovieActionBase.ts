import { AutoMovieBodyRegion } from "../skeleton/AutoMovieBodyRegion";

/**
 * Fields every action verb shares: who performs it and where it sits on the
 * shot's local timeline.
 *
 * `performShot` validates these before any synthesis and reports each fault at
 * its field path.
 *
 * @evidence contracts/common.md#principled-implementation Places every verb on the shot-local timeline by `start` and `duration`, with `"auto"` delegating length to the synthesizer; `repeat` is expanded by `sequenceMotion` into back-to-back copies that outlast the declared span `performShot` checks, an unresolved disagreement.
 * @evidence contracts/common.md#clear-and-simple-design Shared fields live once on the base interface each verb extends, so the discriminated `IAutoMovieActionCall` union adds only verb-specific fields; region inference stays in the engine's `actionRegion` tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `physicsIntent` is documented as silencing plausibility warnings, but no engine path reads it from an action, so the marker currently has no effect; the `fullBody` fallback for verbs absent from the region tables is a stated default.
 * @evidence contracts/common.md#meaningful-documentation States the id rules for `actor`, the bounds of `start`, `duration` and `repeat`, how `"auto"` is sized and spanned, the repeated length, region defaults, and that `physicsIntent` has no reader yet.
 * @author Samchon
 */
export interface IAutoMovieActionBase {
  /**
   * The scene-node id(s) performing this action (reuse ids from staging). A
   * list applies the **same** verb to several actors in **unison** (a chorus
   * line, a crowd, synchronised dancers) instead of repeating the action per
   * actor (fewer tokens, no drift across parallel runs). Every id must be a
   * staged scene node; a list must be non-empty with no duplicates. Only a
   * `frame` action names a camera, and it names exactly one as a string.
   */
  actor: string | string[];

  /** Seconds into the shot when it begins, within `[0, shot duration]`. */
  start: number;

  /**
   * Length in seconds, finite and `> 0` with `start + duration` inside the
   * shot, or `"auto"` to let the engine pick a natural duration (a stride
   * cadence, a punch's snap, a projectile's flight time). The reference
   * synthesizer sizes an `"auto"` clip itself, while `performShot`'s overlap
   * check and an `attachTo` treat the span as running to the shot end, and a
   * `frame` as running until the next camera move.
   */
  duration: number | "auto";

  /**
   * Play the synthesized motion this many times back to back (a positive
   * integer, default 1): a step repeated on the count, an idle sway. Cheaper
   * than N near-identical copies. Each copy lasts `duration`, so the repeated
   * motion runs `repeat * duration` seconds, while `performShot`'s span and
   * overlap checks read only `start + duration`.
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
   */
  region?: AutoMovieBodyRegion;

  /**
   * Acknowledge a deliberate physical implausibility so the engine's
   * physical-plausibility feedback (`"warning"`-severity, see
   * {@link IAutoMovieConstraintViolation.severity}) does not re-fire on this
   * action. A free-text intent (`"defies-gravity"`, `"superhuman-impact"`,
   * `"intentional-clip"`) that marks "this is on purpose". Omit for ordinary
   * actions; the engine warns as usual and the correction loop can address it.
   * No engine path reads this field yet: the plausibility detectors take their
   * own `physicsIntent` argument from their caller.
   */
  physicsIntent?: string;
}
