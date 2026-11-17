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
 * @evidence contracts/development/design.md#principled-representation Cadence is the integral of covered ground over `[0, time]`, so the interval is cut at cue boundaries and each piece records seconds, eased distance and turn, which a consumer sums to get the cycle phase exactly at any seek time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields, each a quantity a cycle consumer adds up; resolving the gait to a figure model stays with the viewer, which knows the runtime models of each LOD tier.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing accumulates between frames, so no frame-to-frame drift is corrected afterwards; a gap carries the previous gait as a stated rule rather than a guess for a missing cue.
 * @evidence contracts/development/common.md#meaningful-documentation States the gait's source and its null before the first cue, the gap gait rule, the seconds, the x-z plane and meter unit of distance, and that the turn is unsigned radians.
 */
export interface IAutoMovieFormationCadenceSegment {
  /**
   * Gait the cue owning this interval calls for, or null before the first cue.
   *
   * This is the cue's own request (`IAutoMovieFormationMotion.gait`, or
   * its `action` label when the cue named no gait), not a resolved figure gait.
   * Which figure can perform it is a question about a runtime model, and a unit
   * can hold several of them at once across its LOD tiers. A gap after a cue
   * keeps that cue's gait.
   */
  gait: string | null;

  /**
   * Seconds this interval lasts; a zero-length gap is never emitted, and with
   * non-overlapping cues no cue interval is zero-length either.
   */
  seconds: number;

  /**
   * Ground meters the unit's own origin covers over this interval, measured in
   * the horizontal x-z plane; zero for a gap between cues.
   */
  distance: number;

  /**
   * Unsigned radians the unit turns about its own origin over this interval;
   * the turn direction is not kept.
   */
  turn: number;
}
