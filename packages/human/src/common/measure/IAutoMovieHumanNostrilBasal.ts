/**
 * One registered nostril sample polygon read in a basal view
 * (`readHumanNostrilBasal`); its reader and source registration own the
 * distinction between this convention and a measured opening.
 *
 * @evidence contracts/common.md#principled-implementation One record carries the three readings one projected margin yields.
 * @evidence contracts/common.md#clear-and-simple-design Three numbers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record holds readings only.
 * @evidence contracts/common.md#meaningful-documentation Each field states its meaning and unit.
 * @evidence contracts/modeling.md#spatial-conventions Square metres and metres in the basal plane of the head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reader carries the definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanNostrilBasal {
  /** Area enclosed by the angularly ordered projected samples, square metres. */
  area: number;

  /** Longest chord of the projected margin, metres. */
  longAxis: number;

  /** Extent of the projected margin perpendicular to the long axis, metres. */
  shortAxis: number;
}
