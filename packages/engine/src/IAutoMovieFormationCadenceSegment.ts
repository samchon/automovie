/**
 *
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
 * @evidence contracts/common.md#principled-implementation `formationCadenceSegments` splits `[0, time]` at cue boundaries and scales each cue's straight-line ground displacement by the same eased progress the sampler places the unit by, so cycle phase and unit position follow one law.
 * @evidence contracts/common.md#clear-and-simple-design Four fields (requested gait label, seconds, ground distance, turn); the figure gait is resolved later per LOD tier, so a segment stays independent of runtime models.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A gap between cues contributes seconds and zero distance by documented rule, because the jump to the next cue's `from` is a sampler discontinuity rather than travel a member walks.
 * @evidence contracts/common.md#meaningful-documentation States why the walk starts at zero, that nothing accumulates between frames, the null gait before the first cue, the horizontal-plane distance, the unsigned turn, and the seconds, meters and radians units.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; the producer emits at most two per cue before `time`, and its filter and sort are costs of `formationCadenceSegments`. Segments are rebuilt for every sampled time from the cue list instead of carried over from the previous frame, because carrying them would make a seek depend on playback history. Four scalars inside a per-call array whose length grows with the unit's cues before `time`; the viewer reads the array and keeps no reference to it.
 * @author Samchon
 */
export interface IAutoMovieFormationCadenceSegment {
  /**
   * Gait the cue owning this interval calls for, or null before the first cue.
   *
   * This is the cue's own request ({@link IAutoMovieFormationMotion.gait}, or
   * its `action` label when the cue named no gait), not a resolved figure gait.
   * Which figure can perform it is a question about a runtime model, and a unit
   * can hold several of them at once across its LOD tiers. A gap after a cue
   * keeps that cue's gait.
   */
  gait: string | null;

  /** Seconds this interval lasts; a zero-length interval is never emitted. */
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
