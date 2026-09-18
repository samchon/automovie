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
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `IAutoMovieSequence` as the portable data boundary for the editorial transition handles requirement.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `IAutoMovieSequence` for the spec editorial transition overlap system contract.
 * @author Samchon
 */
export interface IAutoMovieSequence {
  /**
   * Stable id.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `id` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `id` for the spec editorial transition overlap system contract.
   */
  id: string;

  /**
   * Human / LLM readable name. Null if unnamed.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `name` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `name` for the spec editorial transition overlap system contract.
   */
  name: string | null;

  /**
   * Shots in playback order.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `shots` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `shots` for the spec editorial transition overlap system contract.
   */
  shots: IAutoMovieSequenceEntry[];

  /**
   * Nominal playback frame rate; a render spec may override it.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-handles Exposes `fps` as the portable data boundary for the editorial transition handles requirement.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Types `fps` for the spec editorial transition overlap system contract.
   */
  fps: number;
}
