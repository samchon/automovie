import { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

/**
 * Complete medial-to-lateral flow witnesses. Lower and upper describe the two
 * ends of the authored root band, independently of the hair's radius or count.
 * Interpolation across the root band permits convergence without adding fibres.
 *
 * @evidence contracts/common.md#principled-implementation Witnesses at strictly increasing longitudinal positions with a lower and an upper endpoint each are exactly what the cubic smoothstep and root-band interpolation of `createPortraitEyebrowFlow` reads, and the two ends at zero and one make the interpolation total over the brow.
 * @evidence contracts/common.md#clear-and-simple-design One array of witnesses, each holding two endpoints; interpolation and its validation are owned by the flow function and not by the type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no witness names a subject or a fixture.
 * @evidence contracts/common.md#meaningful-documentation The type states what a witness is, that lower and upper bound the root band and that interpolation across the band lets hairs converge without adding fibres.
 * @evidence contracts/modeling.md#spatial-conventions Longitudinal position and tip are dimensionless fractions of the brow and the bend is head millimetres, each stated in the member types.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a parameter record for one brow and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part and displays nothing.
 * @author Samchon
 */
export interface IPortraitEyebrowFlowProfile {
  /** Strictly increasing complete witnesses, including medial zero and lateral one. */
  sections: readonly {
    /** Medial-to-lateral progress along the brow in [0,1], independent of head-X side. */
    at: number;

    /** Endpoint of a fibre rooted at the lower end of the root band. */
    lower: IPortraitEyebrowFlowDirection;

    /** Endpoint of a fibre rooted at the upper end of the root band. */
    upper: IPortraitEyebrowFlowDirection;
  }[];
}
