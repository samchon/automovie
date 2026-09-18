import { IAutoMovieFormationMotion } from "@automovie/interface";

/**
 * One interval of a unit's shot over which one action runs at one rate.
 *
 * A unit's cadence is not a property of a moment: how fast a member's cycle
 * turns follows the ground its unit has covered since the shot opened, and that
 * ground is spread over every cue the unit has performed so far. So the
 * question "where in its cycle is this member now" is answered by walking the
 * whole interval `[0, time]` once and adding up what each part of it did, which
 * is what these segments are.
 *
 * Nothing accumulates between frames: the same cue list and the same time
 * always produce the same segments, so a re-render is byte-identical and a seek
 * is exact.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Carries each gait, duration, traveled distance, and turn contribution used to reproduce member cadence at an arbitrary seek.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Makes cadence a complete interval result rather than playback-cursor state.
 * @author Samchon
 */
export interface IAutoMovieFormationCadenceSegment {
  /**
   * Gait the cue owning this interval calls for, or null before the first cue.
   *
   * This is the cue's own request ({@link IAutoMovieFormationMotion.gait}, or
   * its `action` label when the cue named no gait), not a resolved figure gait.
   * Which figure can perform it is a question about a runtime model, and a unit
   * can hold several of them at once across its LOD tiers.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Retains the gait or action requested by the cue so runtime capability validation can test it against the selected model.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Exposes the exact motion label whose support must agree between validation and gait baking.
   */
  gait: string | null;
  /**
   * Seconds this interval lasts; a zero-length interval is never emitted.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Preserves the exact bounded film-time contribution of each cadence interval.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Makes cadence integration independent of frame traversal and seek order.
   */
  seconds: number;
  /**
   * Ground meters the unit's own origin covers over this interval.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Records the eased planar travel that advances every member's shared gait phase.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Gives all cadence consumers the same ground-distance operand for direct seeks.
   */
  distance: number;
  /**
   * Radians the unit turns about its own origin over this interval.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Separates deterministic pivot rotation from unit translation so member-radius travel can be composed exactly.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Retains the turn contribution needed to reproduce cadence for differently placed members.
   */
  turn: number;
}
