import { IAutoMovieProductionRenderLayer } from "./IAutoMovieProductionRenderLayer";

/**
 * One exact film-global frame with its transitions already resolved into
 * weighted shot layers.
 *
 * `sampleProductionRenderFrame` produces it from the builder-owned timeline,
 * where output frame and timeline frame are the same number.
 * `planProductionRenderJob` then renumbers it for a proxy tier that renders
 * every `frameStep`-th timeline frame, so the output index, the full-rate
 * timeline frame and the time are separate fields. The production render
 * chunks carry these records, and the capture host renders each layer.
 *
 * @evidence contracts/common.md#principled-implementation Every field is derived from the timeline and one integer frame number, never accumulated: `timeSeconds` is the frame times the rational frame rate's denominator over its numerator, and the layers come from the segment that contains the frame, so a seek, a chunk and a full render produce the same record.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the output index and the timeline frame as two fields because a proxy tier skips timeline frames: the output index names the encoded frame and the timeline frame names the sampled instant, and folding them into one would make a proxy chunk render the wrong instant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither producer special-cases a tier, a shot or a transition kind outside the timeline's own dissolve and fade rules, and the renumbering in `planProductionRenderJob` overwrites only the three numeric fields, leaving the sampled layers untouched.
 * @evidence contracts/common.md#meaningful-documentation States the two producers and the renumbering between them, the consumers, and for each field its numbering base, the timeline it indexes, its unit and that it is derived, and the layer count and order per transition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; the segment lookup that fills it is answered on `sampleProductionRenderFrame`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each record is computed for one frame number, and `planProductionRenderJob` builds the frame list once per job and shares it across every deliverable's chunks rather than resampling per chunk.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds three numbers and one or two layer records by value; the job plan's chunks own the list, which grows with the job's output frame count and is released with the plan.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderFrame {
  /**
   * Zero-based output frame index in this render tier; equals `timelineFrame`
   * at full rate and is `timelineFrame / frameStep` in a proxy tier.
   */
  globalFrame: number;

  /** Zero-based frame on the builder-owned full-rate film timeline. */
  timelineFrame: number;

  /**
   * Film time of this output frame in seconds, computed from the frame index
   * and the tier's rational frame rate rather than accumulated.
   */
  timeSeconds: number;

  /**
   * One layer for a hard cut or a fade, whose weight carries the fade, or two
   * layers during a dissolve, outgoing shot first, whose weights sum to one.
   */
  layers: IAutoMovieProductionRenderLayer[];
}
