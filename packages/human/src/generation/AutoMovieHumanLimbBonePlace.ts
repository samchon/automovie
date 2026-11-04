import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * Where the bone stands front to back in a limb's section: the share of the
 * muscle depth that lies ahead of the bone, at the upper arm, the thigh and
 * the lower leg.
 *
 * Source: Kanehisa H. and Fukunaga T., "Association between body mass index
 * and muscularity in healthy older Japanese women and men", J Physiol
 * Anthropol 32(1):4 (2013), PMC3599217, Table 1: B-mode ultrasound muscle
 * thickness, the muscle's depth from its border with the subcutaneous fat to
 * the bone, at the anterior and posterior sites of the upper arm, thigh and
 * lower leg (Abe et al.'s nine-site method), on the right side of 346 women
 * and 286 men aged about 69 (means, {@link MUSCLE}).
 *
 * Derivation: at each segment's site the bone lies between the anterior and
 * the posterior muscle, so the anterior muscle's share of their sum places the
 * bone in the section's muscle depth: 0.51 at the upper arm (biceps and
 * brachialis against triceps), 0.40 at the thigh (quadriceps against the
 * hamstrings and adductor magnus) and 0.30 at the lower leg (tibialis
 * anterior against the triceps surae), in both sexes alike.
 *
 * Limits: an older sample, whose muscle is thinner than young adults'; muscle
 * only, the subcutaneous fat taken as even front and back and the bone's own
 * diameter left out of the share; one site per segment (the forearm's site
 * is anterior only, so the forearm stays open), and the share is the site's,
 * not a law along the segment.
 */
export namespace AutoMovieHumanLimbBonePlace {
  /** A segment with an anterior and a posterior site. */
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
   * The share of the muscle depth ahead of the bone at a segment's site.
   *
   * @param segment The segment.
   * @param sex The person's sex.
   * @returns The anterior muscle's share of the anterior and posterior muscle, 0 to 1.
   */
  export function front(segment: Segment, sex: AutoMovieHumanSex): number {
    const [anterior, posterior] = MUSCLE[segment][sex === AutoMovieHumanSex.Female ? 0 : 1];
    return anterior / (anterior + posterior);
  }
}
