import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * A validated source disk and the canonical sampled sheet to overlay on it.
 * The chart host reader owns generation and actual skin-incidence validation.
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
