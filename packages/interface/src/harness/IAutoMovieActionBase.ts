import { AutoMovieBodyRegion } from "../skeleton/AutoMovieBodyRegion";

/**
 * Fields every action verb shares: who performs it and where it sits on the
 * shot's local timeline.
 *
 * `performShot` validates these before any synthesis and reports each fault at
 * its field path.
 *
 * @evidence contracts/common.md#principled-implementation `performShot` checks actor ids against the staged nodes and cameras, `start` and a numeric span against `[0, shot duration]`, and `repeat` as a positive integer, then `compilePerformance` repeats each synthesized clip and places it at `start` in the lane `actionRegion` assigns.
 * @evidence contracts/common.md#clear-and-simple-design The timing, actor, repetition and region fields live once here and every verb extends them, so the gate and the compiler read the same names for every verb instead of a per-verb timing shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An auto span runs to the shot end for overlap/attach checks rather than being guessed from synthesis, and physicsIntent is unread. The common gate uses Number.isInteger for repeat without a safe-integer/workload cap and checks only the declared unrepeated span; callers must supply feasible repetition counts, and repeated synthesis is not independently bounded to that span here.
 * @evidence contracts/common.md#meaningful-documentation States who validates the fields; members give the actor list rules and the camera exception, time units and bounds, what `"auto"` means to each consumer, how `repeat` extends the motion but not the checked span, every default region, and that `physicsIntent` has no reader.
 */
export interface IAutoMovieActionBase {
  /**
   * The scene-node id or ids performing this action, reusing ids from staging.
   * A list applies the same verb to several actors in unison (a chorus line, a
   * crowd, synchronised dancers) instead of repeating the action per actor.
   * Every id must be a staged scene node, and a list must be non-empty with no
   * duplicates. Only a `frame` action names a camera, and it names exactly one
   * as a string.
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
   * `frame` as running until the next camera move. An `"auto"` action may not
   * start exactly at the shot end, which leaves it no span.
   */
  duration: number | "auto";

  /**
   * Play the synthesized motion this many times back to back, a positive
   * integer defaulting to 1: a step repeated on the count, an idle sway.
   * `compilePerformance` concatenates the synthesized clip that many times, so
   * the motion runs `repeat` clip lengths, while `performShot`'s span and
   * overlap checks read only `start + duration`.
   */
  repeat?: number;

  /**
   * The body region this action drives ({@link AutoMovieBodyRegion}). Actions
   * whose masked content is disjoint compose concurrently (walk while waving
   * while looking), and actions sharing content take turns. Omitted, the
   * engine's `actionRegion` infers it from the verb and, for gestures, the
   * kind: `locomote` is `fullBody`, because the shipped gaits drive hips,
   * knees, and contralateral arms; `gesture` and `reach` are `upperBody`;
   * `lookAt` and the `nod` and `shake` gestures are `head`; `emote` is `face`;
   * the `bow`, `crouch`, `kick`, `stagger`, `jump`, and `draw` gestures and
   * every other verb are `fullBody`. Overlap is judged on the content
   * surviving those masks (root, bones, expression), so a `fullBody` gait
   * still layers with a disjoint head-only `lookAt`. The engine masks the
   * synthesized clip to the chosen region and `performShot` reports content
   * the mask drops, so override only when the natural region is wrong for the
   * staging. Camera (`frame`) and `attachTo` actions ignore it.
   */
  region?: AutoMovieBodyRegion;

  /**
   * Free-text acknowledgment of a deliberate physical implausibility, such as
   * `"defies-gravity"` or `"intentional-clip"`, meant to stop the engine's
   * warning-severity plausibility feedback (see
   * {@link IAutoMovieConstraintViolation.severity}) from re-firing on this
   * action. No engine or production path reads this field: the plausibility
   * detectors take their own `physicsIntent` argument, and no shot pipeline
   * calls them, so setting it changes nothing today.
   */
  physicsIntent?: string;
}
