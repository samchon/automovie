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
 * `cutSequence` admits the edit plan's ids, references, finite positive spans and rate, trim containment and transition fit, and refuses a nonfinite accumulated runtime. `sequenceTimeline` expects that admission; it still refuses empty cuts, missing referenced shots, duplicate supplied shot ids and a first-entry transition.
 *
 * @evidence contracts/common.md#principled-implementation Each entry adds its played span minus incoming overlap to the output clock. Random-access and forward playback share sample construction and the last-start-at-or-before tie rule; agreement requires an admitted timeline and nondecreasing queries for the stateful cursor.
 * @evidence contracts/common.md#clear-and-simple-design The sequence is an id, a name, one ordered entry list and a nominal rate; timing is derived on demand rather than stored, so there is no second copy of the timeline to keep consistent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid cut is refused by `cutSequence` with a path rather than repaired by shortening a transition or clamping a trim, and `sequenceTimeline` throws on an empty list or a missing shot instead of skipping the entry.
 * @evidence contracts/common.md#meaningful-documentation States derived timing, admission and layout responsibilities, accumulated-clock finiteness, cursor ordering premises, null names and the distinction between nominal and delivered frame rate.
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
