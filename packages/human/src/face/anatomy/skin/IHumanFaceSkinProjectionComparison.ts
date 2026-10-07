import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import type { IHumanFaceSkinProjectionOwnership } from "./IHumanFaceSkinProjectionOwnership";

/**
 * Certified signs of two native rational squared-distance quadratics,
 * their root enclosures and clipped interval partitions. Clearing rational
 * denominators retains the same exact distance order as the projection
 * owner; independently rounded affine geometry does not enter comparison.
 *
 * @evidence contracts/common.md#principled-implementation Certified sign and crossing parameters distinguish represented distance ownership without a squared-width tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the geometric result or input owned by this declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity and explicit numerical units retain the source meaning without an anatomical default or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members document ownership, units and numerical distinctions needed by the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres remain public; dimensionless native feature parameters and explicit local scale are internal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry on an existing skin part and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing caller geometry or its reading and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no render primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Native continuity is checked by the compiled course owner, not certified by this transport type.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers own assembled skin observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence without a measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the relief and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal sculpting interface or clinical conversion.
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionComparison {
  /**
   * Finite root-bearing enclosures of a non-identical polynomial on the full
   * guide, including tangencies and boundary roots. An identical polynomial
   * has no isolated root list: this is empty while sign and every partition
   * interval report zero for its whole-interval tie.
   */
  rootIntervals: readonly IHumanPolynomialRoot[];

  /**
   * Partition the actual validity overlap with certified open-interval ownership.
   * Distinct crossing events require distinct represented boundaries. Tangencies
   * retain their root proof without changing open-interval ownership.
   *
   * @evidence contracts/common.md#principled-implementation Exact endpoint and derivative signs count actual quadratic crossings in the clipped overlap; exact root enclosures determine the intervening owner.
   * @evidence contracts/common.md#clear-and-simple-design One operation returns ordered represented intervals and their exact sign certificates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only actual crossing-order representation loss refuses; stationary-point rounding does not substitute for root existence.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes crossings, tangencies, validity boundaries and complete interval ties.
   * @evidence contracts/modeling.md#spatial-conventions Bounds and signs are dimensionless guide quantities.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no input channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Native transition admission remains with the course compiler.
   * @evidenceExclude contracts/modeling.md#rendered-observation Relief callers own observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no biological quantity.
   * @evidenceExclude contracts/anatomy.md#permitted-range This is a numerical domain, not a clinical interval.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no sculpting control.
   */
  partition(lower: number, upper: number): readonly IHumanFaceSkinProjectionOwnership[];

  /**
   * Negative means the first feature is nearer; zero is an exact distance tie.
   * Parameters outside [0,1] or nonfinite parameters refuse.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates exact integer quadratic coefficients at the parameter's exact dyadic value.
   * @evidence contracts/common.md#clear-and-simple-design One sign predicate owns the represented distance comparison used by envelope selection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No numerical epsilon or anatomical special case changes the comparison.
   * @evidence contracts/common.md#meaningful-documentation States sign meaning, exact tie and parameter domain.
   * @evidence contracts/modeling.md#spatial-conventions Guide parameter and comparison sign are dimensionless.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Evaluates arithmetic and defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no shape control.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Native feature continuity is checked by the course compiler.
   * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owner observes assembled skin.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no physiological value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The parameter domain is geometric, not clinical.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no anatomical authoring input.
   */
  sign(parameter: number): number;
}
