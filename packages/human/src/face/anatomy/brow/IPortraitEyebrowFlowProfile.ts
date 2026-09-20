import { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/**
 * Complete medial-to-lateral flow witnesses. Lower and upper describe the two
 * ends of the authored root band, independently of the hair's radius or count.
 * Interpolation across the root band permits convergence without adding fibres.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Authors distinct head, body and tail directions and upper/lower root-band convergence.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Orders two through 32 complete direction witnesses over anatomical progress zero to one.
 */
export interface IPortraitEyebrowFlowProfile {
  /** Strictly increasing complete witnesses, including medial zero and lateral one. */
  sections: readonly {
    at: number;
    lower: IPortraitEyebrowFlowDirection;
    upper: IPortraitEyebrowFlowDirection;
  }[];
}
