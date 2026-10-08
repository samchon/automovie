import type { IAutoMovieHumanFaceAttachmentChart } from "../../../structures/IAutoMovieHumanFaceAttachmentChart";
import type { IHumanFacePeriocularHostSample } from "./IHumanFacePeriocularHostSample";

/**
 * A validated source disk and the canonical sampled sheet to overlay on it.
 * The chart host reader owns generation and actual skin-incidence validation.
 *
 * @evidence contracts/common.md#principled-implementation Original source and grid topology are supplied together, so intersection needs no spatial nearest-point inference.
 * @evidence contracts/common.md#clear-and-simple-design Three existing owners supply the complete overlay input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires real material samples and the complete ordered boundary.
 * @evidence contracts/common.md#meaningful-documentation Names validation ownership and requires the original immutable construction data.
 * @evidence contracts/modeling.md#spatial-conventions UV coordinates are dimensionless and seats retain actual host ordinals.
 * @evidence contracts/modeling.md#shared-boundaries The ordered material boundary retains the actual source attachment identities.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries construction data rather than a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no public authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The overlay producer determines population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue owner observes final output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal authoring input.
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
