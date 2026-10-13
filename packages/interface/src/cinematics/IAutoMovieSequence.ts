import { IAutoMovieSequenceEntry } from "./IAutoMovieSequenceEntry";

/**
 * A sequence: an ordered cut-list of shots, the editorial timeline, modelled on
 * OpenTimelineIO. Shots play back to back; a hard cut is the default (two
 * adjacent entries with no transition), an optional transition blends them.
 *
 * Each shot keeps its own local time origin; the sequence composes the global
 * timeline by accumulating trimmed durations (minus transition overlap), so
 * reordering or retiming a shot is a local edit and never forces recomputing
 * downstream timestamps.
 *
 * @evidence contracts/common.md#principled-implementation Follows OpenTimelineIO's cut-list model: `sequenceTimeline` lays entries end to end and pulls each transitioned entry back by the transition's duration, so stored entries hold only relative trims and no absolute start times.
 * @evidence contracts/common.md#clear-and-simple-design Holds identity, ordered entries and a nominal fps; render plans sample output at `spec.frameFormat.fps` and record this fps only as editorial metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `sequenceTimeline` throws on an empty list, a first-entry transition or a missing shot instead of repairing them, relying on `cutSequence` or `validateSequenceArtifact` to have refused those inputs first.
 * @evidence contracts/common.md#meaningful-documentation Documents playback order, the null name, the hard-cut default, the relative timeline composition, and that a render spec's fps governs output frames.
 * @author Samchon
 */
export interface IAutoMovieSequence {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /** Shots in playback order; at least one entry. */
  shots: IAutoMovieSequenceEntry[];

  /**
   * Finite positive nominal playback frame rate; a render spec's
   * `frameFormat.fps` governs the frames actually rendered.
   */
  fps: number;
}
