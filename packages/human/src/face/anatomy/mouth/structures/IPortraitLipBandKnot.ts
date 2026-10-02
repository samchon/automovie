/**
 * One thickness-ratio witness along the right(-1) to left(+1) oral span.
 *
 * @evidence contracts/common.md#principled-implementation A knot is a pair of finite numbers, a transverse fraction and a positive ratio, which is all a piecewise thickness profile needs; the ordering, the identity corners and the positivity are enforced where knots are consumed, in `createPortraitLipBandScale`.
 * @evidence contracts/common.md#clear-and-simple-design Two members with no option; the profile logic stays with its one consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries no behavior, subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Both members state their frame and meaning: `at` is the transverse fraction from anatomical right to left and `scale` is a ratio in which one is identity.
 * @evidence contracts/modeling.md#parameter-channels Each knot varies one trait, the vertical vermilion thickness of one band at one transverse station; a ratio of one is neutral and a larger ratio thickens the band. Upper and lower bands carry separate arrays and left-right asymmetry is authored by unequal knots, since the stations run from right to left.
 * @evidence contracts/modeling.md#spatial-conventions `at` is a unitless fraction of the oral span, right (-1) to left (+1); `scale` is a unitless ratio. No length or frame crosses this type.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type describes one profile sample and is not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; both lip boundaries stay fixed by the scaling that consumes it.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `createPortraitLipBandScale` bounds the ratios.
 * @author Samchon
 */
export interface IPortraitLipBandKnot {
  /** Ordered transverse fraction from anatomical right (-1) to left (+1). */
  at: number;

  /** Positive ratio of the current band's vertical thickness; one is identity. */
  scale: number;
}
