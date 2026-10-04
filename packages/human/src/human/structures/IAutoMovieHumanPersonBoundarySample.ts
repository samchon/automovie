/**
 * One canonical sample of the shared face/body neck polyline: its position
 * (metres) and unit normal, both interpolated from the evaluated face loop in
 * the shared Y-up, +Z-forward posed frame.
 *
 * @evidence contracts/common.md#principled-implementation A shared boundary sample is fully described by one position and one normal that both sides copy.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both come from the evaluated face loop; neither side re-derives them.
 * @evidence contracts/common.md#meaningful-documentation States both fields, units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A sample defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The stitch emits the vertex; the sample only carries its values.
 * @evidence contracts/modeling.md#spatial-conventions Metres and a unit direction in the shared Y-up, +Z-forward posed frame.
 * @evidence contracts/modeling.md#shared-boundaries Face and body sides copy the same sample at a shared boundary parameter.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Evaluated geometry, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundarySample {
  /** Position on the face loop, metres. */
  point: number[];

  /** Unit normal interpolated along the face loop. */
  normal: number[];
}
