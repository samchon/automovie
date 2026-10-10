import type { IPortraitEyebrowFlowSection } from "./IPortraitEyebrowFlowSection";

/**
 * Complete medial-to-lateral flow witnesses. Lower and upper describe the two
 * ends of the authored root band, independently of the hair's radius or count.
 * Interpolation across the root band permits convergence without adding fibres.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowProfile {
  /** Strictly increasing complete witnesses, including medial zero and lateral one. */
  sections: readonly IPortraitEyebrowFlowSection[];
}
