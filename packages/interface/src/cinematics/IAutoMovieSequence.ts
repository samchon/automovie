import type { IAutoMovieSequenceEntry } from "./IAutoMovieSequenceEntry";

/**
 * A sequence: an ordered cut-list of shots, the editorial timeline, modelled on
 * OpenTimelineIO. Shots play back to back; a hard cut is the default (two
 * adjacent entries with no transition), and an optional transition blends
 * them.
 *
 * The sequence stores no global timestamps. Each shot keeps its own local time
 * origin, and `sequenceTimeline` derives the output clock by accumulating each
 * entry's retained source duration divided by its playback rate minus its
 * incoming transition, so reordering or retiming a shot edits one entry and
 * never a stored downstream time.
 *
 * `cutSequence` admits the edit plan's ids, references, finite positive spans,
 * frame rate and entry rates, trim containment and transition fit, and refuses
 * a nonfinite accumulated runtime. `sequenceTimeline` expects that admission;
 * it still refuses empty cuts, missing referenced shots, duplicate supplied
 * shot ids a first-entry transition and a playback rate that cannot produce a
 * representable output span.
 */
export interface IAutoMovieSequence {
  /** Stable id. */
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
