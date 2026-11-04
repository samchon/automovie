import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * Anterior muscle thickness divided by the sum of paired anterior and
 * posterior thickness means at one site of each limb segment. This ratio
 * does not independently locate a bone centre in a whole skin section.
 *
 * Source: Kanehisa H. and Fukunaga T., "Association between body mass index
 * and muscularity in healthy older Japanese women and men", J Physiol
 * Anthropol 32(1):4 (2013), PMC3599217, Table 1: B-mode ultrasound muscle
 * thickness, the muscle's depth from its border with the subcutaneous fat to
 * the bone, at the anterior and posterior sites of the upper arm, thigh and
 * lower leg (Abe et al.'s nine-site method), on the right side of 346 women
 * and 286 men aged about 69 (means, {@link MUSCLE}).
 *
 * Derivation: anterior / (anterior + posterior) gives approximately 0.51 at
 * the upper arm, 0.40 at the thigh and 0.30 at the lower leg. These are
 * ratios of cohort means, not means of participants' individual ratios.
 *
 * Limits: an older sample, muscle only and one site per segment; no paired
 * forearm reading is available. Fat, bone diameter, the skin-section
 * centroid and the mechanical axis are not supplied. Applying this ratio
 * to whole skin depth or along a segment would be an additional modelling
 * proxy, not a published skin-placement law. No current production or test
 * caller imports this helper; LegLaws now reads the retained skin-support q.
 *
 * @evidence contracts/common.md#principled-implementation Exposes the ratio of the cited cohort's paired thickness means, separating that arithmetic from the unsupported transfer to whole skin depth or a bone centre.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the three segment records and their scalar ratio together; consumers own any skin or skeletal placement assumption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no new coefficient or person branch, makes no whole-skin transfer and states the helper's current unconsumed status.
 * @evidence contracts/common.md#meaningful-documentation Gives the primary table, cohort, units, ratio derivation, single-site limit and missing fat/bone/axis information.
 * @evidence contracts/performance.md#efficient-algorithms A fixed segment/sex lookup and one ratio use constant time and local scalar space.
 * @evidence contracts/performance.md#reuse-equivalent-work All callers share the same twelve module-owned thickness means; the scalar calculation needs no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fixed three-segment table persists for its module instance; calls retain no source, figure or output object.
 */
export namespace AutoMovieHumanLimbBonePlace {
  /**
   * A segment for which the cited table provides both thickness sites.
   *
   * @evidence contracts/common.md#principled-implementation The union names only the three segments with paired source measurements and excludes the anterior-only forearm.
   * @evidence contracts/common.md#clear-and-simple-design One key union constrains the fixed table and scalar lookup together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Introduces no fixture name, expected result or unsupported segment.
   * @evidence contracts/common.md#meaningful-documentation Explains why these three segment keys are supported.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union implements no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type performs no repeated computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates no runtime state or resource.
   */
  export type Segment = "upperArm" | "thigh" | "lowerLeg";

  /** Anterior and posterior muscle thickness at each segment's site, women and men, mm (means). */
  export const MUSCLE: Readonly<Record<Segment, readonly [readonly [number, number], readonly [number, number]]>> = {
    upperArm: [
      [28.4, 26.9],
      [33.3, 32.8],
    ],
    thigh: [
      [38.1, 56.6],
      [42.1, 61.9],
    ],
    lowerLeg: [
      [25.9, 59.5],
      [28.7, 66.0],
    ],
  };

  /**
   * The anterior thickness mean's share of the two means at a segment's
   * site. The supported table has positive finite thicknesses; this helper
   * neither measures a skin section nor translates its centroid to a bone.
   *
   * @param segment The segment.
   * @param sex The person's sex.
   * @returns Anterior / (anterior + posterior), dimensionless and between 0 and 1.
   *
   * @evidence contracts/common.md#principled-implementation Directly evaluates the ratio of two positive finite table means; their fixed sum is nonzero, and no skin-depth or bone-centre inference is part of the result.
   * @evidence contracts/common.md#clear-and-simple-design One segment/sex lookup and one expression expose the published quantities' derived ratio.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no clamp, fitted offset, fixture branch or whole-skin correction.
   * @evidence contracts/common.md#meaningful-documentation Names the mean-ratio interpretation, units, positive-input premise and placement limits.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-key lookup, addition and division take constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar expression coordinates no requests, phases or reusable geometry.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The call borrows two numbers from the module table and returns a number without retaining call state.
   */
  export function front(segment: Segment, sex: AutoMovieHumanSex): number {
    const [anterior, posterior]: readonly [number, number] = MUSCLE[segment][sex === AutoMovieHumanSex.Female ? 0 : 1];
    return anterior / (anterior + posterior);
  }
}
