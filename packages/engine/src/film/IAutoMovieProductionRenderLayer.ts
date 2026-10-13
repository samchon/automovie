/**
 * One shot image participating in a film-global output frame.
 *
 * A layer names the compiled shot, the exact shot-local integer frame the edit
 * maps the film frame to, and its compositing weight, so one film frame
 * resolves every participating shot at one declared source instant.
 * `sampleProductionRenderFrame` produces it; `productionRenderLayersForPass`
 * composites beauty layers by weight and gives a structural guide pass only the
 * heaviest layer, the incoming one on a tie, and production checks a mask chunk's semantic sidecars
 * against that selection.
 *
 * @evidence contracts/common.md#principled-implementation `sourceFrame` is the segment's `sourceInFrame` plus the integer offset into the segment, and during a dissolve the outgoing layer reads its tail ending at `sourceOutFrame`; the weight is that offset over the transition length, so the layer is an exact integer sample rather than a resampled time.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, which shot, which of its frames and how much of it, are all a compositor needs; the transition kind is not repeated because the layer count and weights already encode it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights come only from the transition's frame offset, never from a shot id or a pass, and a pass that cannot blend selects a layer through `productionRenderLayersForPass` instead of receiving a rewritten record.
 * @evidence contracts/common.md#meaningful-documentation States the producer and both consumers, how guide passes treat weights, and for each field its owner, its integer and shot-local frame basis, and its range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape with no runtime body; computing it is constant work answered on `sampleProductionRenderFrame`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A layer is part of one frame record and is never recomputed separately; pass selection copies it with `structuredClone` so one pass cannot alter what another reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds a string and two numbers by value; its frame record is its only owner.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderLayer {
  /** Id of the compiled shot this layer renders, as the timeline names it. */
  shot: string;

  /** Zero-based integer frame on that shot's own clock. */
  sourceFrame: number;

  /**
   * Linear compositing weight in `[0, 1]`: `1` for a plain cut, the fade
   * factor during a fade, and complementary values across a dissolve.
   */
  weight: number;
}
