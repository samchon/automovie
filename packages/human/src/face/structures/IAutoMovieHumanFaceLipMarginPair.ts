/**
 * One upper/lower vermilion margin vertex pair on the contact's lips surface,
 * away from the midline.
 *
 * Margin pairs sample the oral fissure from the midline toward each
 * commissure. Closure weight one brings every registered pair, with the
 * central pair, to margin contact.
 *
 * @evidence contracts/common.md#principled-implementation Each pair is two resident vertices facing each other across the fissure, read like the central pair.
 * @evidence contracts/common.md#clear-and-simple-design Two vertex indices on the surface the central lips pair names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pairs are registered by preparation, never guessed at runtime.
 * @evidence contracts/common.md#meaningful-documentation States what a pair samples and what closure does with it.
 * @evidence contracts/modeling.md#part-identity-and-grouping Both vertices belong to the lips surface the contact names.
 * @evidenceExclude contracts/modeling.md#parameter-channels The pair is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The pair emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Indices carry no unit.
 * @evidence contracts/modeling.md#shared-boundaries The pairs sample the boundary where upper and lower vermilion meet in contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact summary reports the residual apertures.
 * @evidence contracts/anatomy.md#anatomical-source Lip seal is contact along the whole vermilion margin, not one midline point.
 * @evidenceExclude contracts/anatomy.md#permitted-range The pair bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The pair is basis registration, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLipMarginPair {
  /** Upper vermilion margin vertex on the lips surface. */
  upper: number;

  /** Lower vermilion margin vertex facing it across the fissure. */
  lower: number;
}
