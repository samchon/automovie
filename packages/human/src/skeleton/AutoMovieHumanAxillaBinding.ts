import type { IAutoMovieHumanBindingArm } from "./IAutoMovieHumanBindingArm";
import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The axilla piece: where an arm's skin meets the trunk's.
 *
 * The arm takes the skin nearer its own capsules than the trunk's, over a band
 * as wide as its glenohumeral turn needs. The band's argument is a difference
 * of two distances, whose gradient reaches 2, so its half is twice the
 * shoulder ramp's. It never reaches past the arm's girth radius: trunk skin
 * that far out, turned round the glenohumeral centre with a raised arm,
 * swelled the side of the chest into a ball. Nor does it reach past the bind's
 * gap between the arm and the trunk from the elbow's ramp down: there the two
 * are apart, and a wider band left trunk weight on the elbow, which tore with
 * the arm raised. Where the band stays short of the turn's need, the stretch
 * left over belongs to the scapula, which the rig does not carry.
 */
export namespace AutoMovieHumanAxillaBinding {
  /** Least half of an arm's comparison with the trunk, in skin depths at the shoulder (convention). */
  export const ARM_CONTEST: number = 0.6;

  /**
   * An arm's band against the trunk before it is widened.
   *
   * @param shoulder The skin's depth at the glenohumeral centre, metres.
   * @returns The least half, metres.
   */
  export function least(shoulder: number): number {
    return ARM_CONTEST * shoulder;
  }

  /**
   * Widen an arm's band to its shoulder's turn, from the elbow's ramp down
   * where the arm and the trunk are apart.
   *
   * @param arm The arm; its `contest` is widened.
   * @param skin Skin samples, metres, three numbers each.
   * @param holder The rig slot of the bone that leads each sample under the starting ramps.
   * @param ramp The glenohumeral ramp's half, metres, or zero when it has none.
   */
  export function fit(
    arm: IAutoMovieHumanBindingArm,
    skin: Float64Array,
    holder: Int32Array,
    ramp: number,
  ): void {
    const upper: IAutoMovieHumanBindingLimb = arm.limb.kids.find(
      (k: IAutoMovieHumanBindingLimb): boolean => /UpperArm$/.test(k.bone),
    )!;
    const elbow: IAutoMovieHumanBindingLimb["planes"][number] | undefined =
      upper.kids[0]?.planes[0];
    const beyond: Set<number> = new Set<number>(
      upper.kids
        .flatMap(AutoMovieHumanLimbCapsule.family)
        .map((l: IAutoMovieHumanBindingLimb): number => l.slot),
    );
    const gapped: number = gap(
      skin,
      (i: number, p: Math3D.Vector): boolean =>
        beyond.has(holder[i]!) ||
        (holder[i] === upper.slot &&
          elbow !== undefined &&
          (p[0] - elbow.at[0]) * elbow.normal[0] +
            (p[1] - elbow.at[1]) * elbow.normal[1] +
            (p[2] - elbow.at[2]) * elbow.normal[2] >=
            -elbow.half),
      (p: Math3D.Vector): number =>
        AutoMovieHumanLimbCapsule.nearest(p, arm.limb.rivals) -
        AutoMovieHumanLimbCapsule.nearest(p, arm.own),
    );
    arm.contest = contest(arm.contest, gapped, upper.near, ramp);
  }

  /**
   * The bind's gap between the arm and the trunk.
   *
   * @param points Skin samples, metres, three numbers each.
   * @param apart Whether a sample lies where the arm and the trunk are apart.
   * @param difference A point's distance to the trunk's capsules less its distance to the arm's.
   * @returns The least difference over those samples, metres.
   */
  export function gap(
    points: Float64Array,
    apart: (index: number, p: Math3D.Vector) => boolean,
    difference: (p: Math3D.Vector) => number,
  ): number {
    let out: number = Infinity;
    for (let i: number = 0; i < points.length / 3; i++) {
      const p: Math3D.Vector = [points[3 * i]!, points[3 * i + 1]!, points[3 * i + 2]!];
      if (apart(i, p)) out = Math.min(out, difference(p));
    }
    return out;
  }

  /**
   * The band's half, in the band argument's units (metres of capsule height
   * difference). Twice the shoulder ramp's half (derived: the difference's
   * gradient reaches 2), capped by the girth radius and the gap (geometric),
   * and never below the old least half; the rig divides the difference by it
   * on the `slide` step for the arm's share.
   *
   * @param least The least half, metres.
   * @param gap The bind's gap from the elbow down, metres.
   * @param girth The arm's girth radius, metres.
   * @param ramp The shoulder ramp's half, metres.
   * @returns The half, metres.
   */
  export function contest(
    least: number,
    gap: number,
    girth: number,
    ramp: number,
  ): number {
    return Math.max(least, Math.min(gap, girth, 2 * ramp));
  }
}
