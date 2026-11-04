/**
 * A chord from a join's curve to one rail set by the fold the two surfaces make there: `radius tan(beta / 2)`, `beta` the turn between the outward normals of the result's two faces at the traced point (for a diff the part's inward normal, since its inside is kept), capped at `cap`.
 *
 * It is the tangent length of a rolling ball of the stated radius in the fold's normal plane, so a blend widens where the parts meet at a steep angle and narrows where they meet nearly flat, as a skin fold of one radius does. The engine evaluates it at every traced point and reads it between them by the periodic cubic B-spline through those values, C2 round the loop.
 *
 * Engine admission: `radius` and `cap` positive.
 *
 * @evidence contracts/common.md#principled-implementation A circle of radius R tangent to two planes that meet at the turn beta touches each a distance R tan(beta / 2) from their line, the rolling-ball blend's chord, read here at each traced point.
 * @evidence contracts/common.md#clear-and-simple-design A radius and a cap state the law; the turn comes from the surfaces, not from another field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cap bounds a near-flat fold's chord rather than any rail being moved after the fact.
 * @evidence contracts/common.md#meaningful-documentation States the formula, its geometric source, where it is evaluated and interpolated, the cap and the admission.
 */
export interface IAutoMovieConstructionFoldWidth {
  /** Discriminator. */
  type: "fold";

  /** The fold's rolling radius, metres, positive. */
  radius: number;

  /** The largest chord, metres, positive. */
  cap: number;
}
