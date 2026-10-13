import { IAutoMovieSequenceEntry } from "./IAutoMovieSequenceEntry";

/**
 * A sequence: an ordered cut-list of shots, the editorial timeline, modelled on
 * OpenTimelineIO. Shots play back to back; a hard cut is the default (two
 * adjacent entries with no transition), and an optional transition blends
 * them.
 *
 * The sequence stores no global timestamps. Each shot keeps its own local time
 * origin, and `sequenceTimeline` derives the output clock by accumulating each
 * entry's played span minus its incoming transition, so reordering or retiming
 * a shot edits one entry and never a stored downstream time.
 *
 * `cutSequence` produces it from an edit plan and refuses a blank id, an empty
 * entry list, an unknown shot, a trim outside its shot, a transition on the
 * first entry or longer than either neighbour's played span, overlapping
 * transitions inside one entry, and a non-positive frame rate.
 *
 * @evidence contracts/common.md#principled-implementation Follows the OpenTimelineIO track model: entries are laid end to end, a transition pulls its entry forward by its duration, and `sequenceTimeline` and `playbackCursor` compute the same starts so random access and forward playback agree on every instant.
 * @evidence contracts/common.md#clear-and-simple-design The sequence is an id, a name, one ordered entry list and a nominal rate; timing is derived on demand rather than stored, so there is no second copy of the timeline to keep consistent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid cut is refused by `cutSequence` with a path rather than repaired by shortening a transition or clamping a trim, and `sequenceTimeline` throws on an empty list or a missing shot instead of skipping the entry.
 * @evidence contracts/common.md#meaningful-documentation States the cut and transition model, that no global time is stored and how the output clock is derived, every refusal of the producer, what a null name means, and which rate governs rendered frames.
 * @author Samchon
 */
export interface IAutoMovieSequence {
  /** Stable, non-blank id. */
  id: string;

  /** Human or LLM readable name, or `null` when unnamed. */
  name: string | null;

  /** Shots in playback order; at least one entry. */
  shots: IAutoMovieSequenceEntry[];

  /**
   * Finite positive nominal playback frame rate; a render spec's
   * `frameFormat.fps` governs the frames actually rendered.
   */
  fps: number;
}
