/**
 * How the internal anatomy of an assembly follows its skin when the body is shaped.
 *
 * An assembly is registered to one neutral skin. A shape channel moves that
 * skin, and the bones, muscles and other tissue under it have to move with
 * it or they are left behind and pierce it. This record declares that they
 * follow, and by which rule: each internal vertex takes the displacement of
 * the rest skin near it, as the inverse-distance weighted mean over its
 * nearest neutral skin vertices. A vertex close under the skin moves with
 * that skin; a vertex deep in a limb averages the skin all around it, so a
 * change of girth largely cancels there.
 *
 * This is a first, coarse rule and is declared as such. It is a smooth
 * interpolation of an exterior displacement, not a tissue model: it does not
 * keep a bone rigid, conserve a muscle's volume or know which tissue a
 * vertex belongs to. An assembly without this record follows nothing, and a
 * document whose shape differs from the registered one is then refused as
 * before.
 *
 * @evidence contracts/common.md#principled-implementation Inverse-distance weights are positive and sum to one, so an internal vertex moves by a convex combination of nearby skin displacements and never farther than the skin around it does.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers define the rule; the weights are derived from the neutral geometry and are not stored.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is one formula for every part and channel; no part, channel or region is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what following means, why deep vertices average out, and what the rule does not preserve.
 * @evidence contracts/modeling.md#parameter-channels Every shape channel reaches the internal parts only through the skin displacement it produces, so no channel has a second, separate effect on anatomy.
 * @evidence contracts/modeling.md#shared-boundaries The skin's displacement is the one definition both the exterior and the tissue under it consume when the body is shaped.
 * @evidence contracts/anatomy.md#anatomical-source No anatomical value is carried; the rule is declared an authored interpolation with no tissue mechanics behind it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The follower owns frames and units.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#permitted-range The body's shape channels own their ranges; the layer-order reader judges the shaped result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is offline source data, not an authoring input.
 */
export interface IAutoMovieHumanBodyExteriorBinding {
  /** How many nearest neutral skin vertices each internal vertex averages. */
  neighbours: number;

  /** Exponent of the inverse distance that weights them. */
  power: number;

  /** Authoring account of the rule and of what it leaves unmodelled. */
  account: string;
}
