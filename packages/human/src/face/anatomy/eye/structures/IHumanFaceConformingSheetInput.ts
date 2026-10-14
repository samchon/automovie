import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * A validated source disk and the canonical sampled sheet to overlay on it.
 * The chart host reader owns generation and actual skin-incidence validation.
 *
 *
 * @evidence contracts/common.md#principled-implementation A previously admitted same-generation source chart and complete sampled material boundary define the overlay population.
 * @evidence contracts/common.md#clear-and-simple-design The chart reader owns source incidence and the sheet owner owns positive refinement/coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refinement applies once before native clipping and never changes the source registration.
 * @evidence contracts/common.md#meaningful-documentation Fields identify material samples, nonrepeated ordered boundary and existing density meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingSheetInput is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingSheetInput declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingSheetInput itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingSheetInput {
  /** Same-generation chart already validated against the actual skin host. */
  chart: IAutoMovieHumanFaceAttachmentChart;

  /** Original sampler array; every referenced sample needs materialPoint. */
  samples: readonly IHumanFacePeriocularHostSample[];

  /** Complete ordered material-boundary sample IDs, without a repeated seam. */
  boundary: readonly number[];

  /** Existing cross-band cell count, applied to each original material-domain triangle before native clipping. */
  refinement: number;
}
