import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * Capsule geometry of the binding's limbs: how far a point stands from a
 * limb's flesh, and which limbs belong to a limb.
 *
 * A limb's flesh is a capsule from its joint to its end whose radius runs from
 * `near` to `far` along the segment. Comparing capsules decides what lies
 * beside what (an arm against the trunk, a finger against its neighbour, the
 * head against the neck); it cannot hand skin down a limb, which the planes of
 * the tree do. Every contest of the binding reads the numbers here, so a
 * contest changes by its width and its capsules, not by its measure.
 */
export namespace AutoMovieHumanLimbCapsule {
  /** Smallest limb radius a capsule is measured in, mm (convention: a bone's flesh is never thinner than a finger's tip). */
  export const MINIMUM_RADIUS: number = 4;

  /**
   * A limb's capsule radius from its joint's girth radius.
   *
   * @param radius The joint's girth radius, calibration millimetres.
   * @param scale Metres per calibration millimetre.
   * @returns The radius, metres, at least {@link MINIMUM_RADIUS}.
   */
  export function girth(radius: number, scale: number): number {
    return Math.max(radius, MINIMUM_RADIUS) * scale;
  }

  /**
   * A point's height over a limb's capsule.
   *
   * The nearest point on the segment decides the axis distance, and the
   * radius there grows cubically from `near` to `far` (convention: a limb
   * keeps its girth over most of its length and swells or narrows at its end).
   *
   * @param p The point, metres.
   * @param limb The limb.
   * @returns Distance to the capsule's surface, metres; negative inside it.
   */
  export function height(
    p: Math3D.Vector,
    limb: IAutoMovieHumanBindingLimb,
  ): number {
    // Componentwise, without a vector per call: this runs per skin sample
    // and per limb.
    const d0: number = limb.to[0] - limb.from[0];
    const d1: number = limb.to[1] - limb.from[1];
    const d2: number = limb.to[2] - limb.from[2];
    const e0: number = p[0] - limb.from[0];
    const e1: number = p[1] - limb.from[1];
    const e2: number = p[2] - limb.from[2];
    const squared: number = d0 * d0 + d1 * d1 + d2 * d2;

    // The share of the segment the point projects to, clamped onto it.
    const f: number =
      squared === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, (e0 * d0 + e1 * d1 + e2 * d2) / squared),
          );
    return (
      Math.hypot(e0 - f * d0, e1 - f * d1, e2 - f * d2) -
      (limb.near + (limb.far - limb.near) * f * f * f)
    );
  }

  /**
   * Smallest height of a point over a set of capsules.
   *
   * @param p The point, metres.
   * @param limbs The capsules.
   * @returns The least height, metres; infinity for no capsule.
   */
  export function nearest(
    p: Math3D.Vector,
    limbs: readonly IAutoMovieHumanBindingLimb[],
  ): number {
    let best: number = Infinity;
    for (const limb of limbs) best = Math.min(best, height(p, limb));
    return best;
  }

  /**
   * A limb and every limb below it.
   *
   * @param limb The limb.
   * @returns The limb first, then its descendants depth first.
   */
  export function family(
    limb: IAutoMovieHumanBindingLimb,
  ): IAutoMovieHumanBindingLimb[] {
    return [limb, ...limb.kids.flatMap(family)];
  }

  /**
   * A limb's length.
   *
   * @param limb The limb.
   * @returns Distance from its start to its end, metres.
   */
  export function length(limb: IAutoMovieHumanBindingLimb): number {
    return Math.hypot(...Math3D.sub(limb.to, limb.from));
  }

  /**
   * Distance from a point to the nearest skin sample: the skin's depth there.
   *
   * @param p The point, metres.
   * @param skin Skin samples, metres, three numbers each.
   * @returns The distance, metres; infinity for no sample.
   */
  export function depth(p: Math3D.Vector, skin: Float64Array): number {
    let best: number = Infinity;
    for (let i: number = 0; i < skin.length; i += 3) {
      const x: number = skin[i]! - p[0];
      const y: number = skin[i + 1]! - p[1];
      const z: number = skin[i + 2]! - p[2];
      const d: number = x * x + y * y + z * z;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
}
