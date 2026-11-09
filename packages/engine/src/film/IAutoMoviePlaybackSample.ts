/**
 * What plays at one output instant: the live entry's shot at its local time,
 * plus, inside the live entry's incoming transition, the outgoing entry's tail
 * and the incoming weight ramping from 0 to 1 across the transition.
 *
 * `resolveFromTimeline` and `playbackCursor` build it with the same arithmetic,
 * so random access and a forward sweep return identical samples for the same
 * instant; `resolveSequencePlayback` and `playbackFrameSamples` return it, and
 * the render and caption plans turn it into frames and cues.
 *
 * @evidence contracts/development/design.md#principled-representation The live entry is the last one whose span contains the instant, so the incoming shot wins inside an overlap; `time` is `offset + (seconds - start)` of that entry, and inside its transition `blend.time` is the same map applied to the previous entry and `alpha` is the elapsed fraction `(seconds - start) / transition.duration`, linear in output time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One live shot and at most one outgoing tail, because `cutSequence` forbids adjacent transitions from overlapping inside a played span, so no instant ever mixes three shots and a nullable `blend` is the whole state. Remaining gap: the private `sampleAt` that builds it is written out twice, in `resolveFromTimeline.ts` and `playbackCursor.ts`, rather than shared.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No transition kind is special-cased: every transition yields the same linear weight, and a hard cut is stated by a null `blend` rather than a zero `alpha`.
 * @evidence contracts/development/common.md#meaningful-documentation States the producers and consumers, which entry is live in an overlap, the shot-local clock of both times, and what `alpha` weighs and how it ramps.
 */
export interface IAutoMoviePlaybackSample {
  /** Id of the live (incoming) shot. */
  shot: string;

  /** Shot-local seconds into the live shot. */
  time: number;

  /** The outgoing tail being dissolved from, or null outside a transition. */
  blend: {
    /** Id of the outgoing shot, the previous sequence entry's shot. */
    shot: string;

    /** Shot-local seconds into the outgoing shot. */
    time: number;

    /**
     * Weight of the incoming live shot in `[0, 1)`: 0 at the transition's first
     * instant, rising linearly with output time; at the transition's end the
     * sample has no `blend`.
     */
    alpha: number;
  } | null;
}
