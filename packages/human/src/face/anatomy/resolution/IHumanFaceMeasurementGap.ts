/**
 * Why a face measurement reader cannot read the current basis.
 *
 * @evidence contracts/common.md#principled-implementation A reader that lacks its registration answers with the missing structure instead of a guess.
 * @evidence contracts/common.md#clear-and-simple-design One named reason.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proxy value accompanies the gap.
 * @evidence contracts/common.md#meaningful-documentation States what the reason names.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A gap names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A gap is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A gap emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions A gap carries no value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A gap builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the gap.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A gap carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A gap bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A gap is output, not input.
 * @author Samchon
 */
export interface IHumanFaceMeasurementGap {
  /** What the basis lacks, for example an unregistered landmark. */
  reason: string;
}
