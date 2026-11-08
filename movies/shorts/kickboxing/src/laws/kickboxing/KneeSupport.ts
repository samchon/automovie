import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IFighterMeasure } from "./IFighterMeasure";
import { StanceShape } from "./StanceShape";

/**
 * A standing figure never locks both knees: wherever he holds his weight on
 * his feet, the root sinks until his supporting knees keep their least bend.
 * Upright, at least one supporting knee keeps {@link UPRIGHT}; in the
 * fighting stance both keep {@link STANCE}. Flight, the kicking leg's swing,
 * a jump and a fall, carry no weight and are exempt.
 *
 * ```ts
 * posture.drop = Math.max(posture.drop, KneeSupport.drop(measure, KneeSupport.legs(rest, hips), KneeSupport.STANCE, "both"));
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#stance Knees bent inside the translated stance range.
 * @evidence docs/research/kickboxing/techniques.md#standing-knees The supporting knee is never fully extended while standing or walking.
 */
export namespace KneeSupport {
  /**
   * Least knee flexion of an upright supporting leg, degrees: the knee meets
   * the floor about 5° flexed and stays flexed through stance (Perry and
   * Burnfield 2010, Gait Analysis, chapter 5).
   */
  export const UPRIGHT: number = 5;

  /** Least flexion of each knee in the fighting stance, degrees: the lower bound of the translated stance range. */
  export const STANCE: number = StanceShape.KNEE_FLEXION_RANGE[0];

  /** Lift above the planted ankle height under which a foot still carries weight, metres: a millimetre, the solver's tolerance. */
  export const PLANTED: number = 0.001;

  /** One leg: the floor run from its hip joint to its ankle and the ankle's height, metres. */
  export interface ILeg {
    /** Floor distance from the hip joint to the ankle. */
    run: number;

    /** Ankle height above the floor. */
    ankle: number;
  }

  /**
   * The supporting legs of a figure: each foot planted at its ankle height,
   * with its floor run from the hip joint of its side.
   *
   * @param measure The figure's measure.
   * @param feet Root-frame ankle points.
   * @param shift The root's floor shift, metres forward and left.
   * @returns The legs carrying weight.
   */
  export function legs(
    measure: IFighterMeasure,
    feet: Record<"left" | "right", IAutoMovieVector3 | null>,
    shift: { forward: number; left: number },
  ): ILeg[] {
    const out: ILeg[] = [];
    for (const side of ["left", "right"] as const) {
      const p = feet[side];
      if (p === null || p.y > measure.ankle + PLANTED) continue;
      const z: number =
        shift.left + (side === "left" ? 1 : -1) * measure.hipHalfWidth;
      out.push({ run: Math.hypot(p.x - shift.forward, p.z - z), ankle: p.y });
    }
    return out;
  }

  /**
   * The least root drop that keeps the supporting knees bent: each leg's
   * chord at the least flexion leans over its floor run, which fixes how
   * high its hip joint may stand.
   *
   * @param measure The figure's measure.
   * @param legs The supporting legs.
   * @param flexion The least knee flexion, degrees.
   * @param rule "both": every supporting knee; "one": at least one.
   * @returns Metres; 0 with no supporting leg.
   */
  export function drop(
    measure: IFighterMeasure,
    legs: readonly ILeg[],
    flexion: number,
    rule: "both" | "one",
  ): number {
    if (legs.length === 0) return 0;
    const { thigh, shank } = measure;
    const interior: number = Math.PI - (flexion * Math.PI) / 180;
    const chord: number = Math.sqrt(
      thigh * thigh + shank * shank - 2 * thigh * shank * Math.cos(interior),
    );
    const needed: number[] = legs.map(
      (leg) =>
        measure.hip -
        leg.ankle -
        Math.sqrt(Math.max(0, chord * chord - leg.run * leg.run)),
    );
    return Math.max(
      0,
      rule === "both" ? Math.max(...needed) : Math.min(...needed),
    );
  }

  /**
   * Knee flexion of a leg whose hip joint stands at a height over its ankle.
   *
   * @param measure The figure's measure.
   * @param leg The leg.
   * @param hip The hip joint's height, metres.
   * @returns Degrees; 0 when the leg cannot reach.
   */
  export function flexion(
    measure: IFighterMeasure,
    leg: ILeg,
    hip: number,
  ): number {
    const { thigh, shank } = measure;
    const chord: number = Math.min(
      thigh + shank,
      Math.hypot(leg.run, hip - leg.ankle),
    );
    const c: number =
      (thigh * thigh + shank * shank - chord * chord) / (2 * thigh * shank);
    return 180 - (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  }
}
