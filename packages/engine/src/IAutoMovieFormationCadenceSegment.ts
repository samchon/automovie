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
 * @evidence contracts/common.md#principled-implementation Cadence is the integral of covered ground over `[0, time]`, so the interval is cut at cue boundaries and each piece records seconds, eased distance and turn, which a consumer sums to get the cycle phase exactly at any seek time.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, each a quantity a cycle consumer adds up; resolving the gait to a figure model stays with the viewer, which knows the runtime models of each LOD tier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing accumulates between frames, so no frame-to-frame drift is corrected afterwards; a gap carries the previous gait as a stated rule rather than a guess for a missing cue.
 * @evidence contracts/common.md#meaningful-documentation States the gait's source and its null before the first cue, the gap gait rule, the seconds, the x-z plane and meter unit of distance, and that the turn is unsigned radians.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Plain record; producing the list costs one sort of the unit's cues and one pass over them in `formationCadenceSegments`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each segment list is rebuilt from the cue list and the time; the type has no identity that would let one list stand for another time.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four scalars; a list holds at most two segments per cue started before the time plus one trailing gap, and its caller owns it.
 * @author Samchon
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
