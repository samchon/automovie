import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";

/**
 * How far a torque through the arm bends a trunk that resists it: the share of
 * the trunk's side-bending range at which its stiffness holds the torque, the
 * share `HumanTrunkTurn.turned` takes.
 *
 * The trunk's lateral bending stiffness rises through its range; the pooled
 * values by quarter of the range are Watt, Callaway and Williams 2022 (Med Biol
 * Eng Comput 60(8):2133-2157, "In vivo through-range passive stiffness of the
 * lumbar spine: a meta-analysis", Table 6): 0.32, 0.83, 2.03 and 5.03 N m per
 * degree. The moment a bend of share `s` holds is the stiffness integrated over
 * the angle, `R Σ k_q overlap(s, q)` with `R` the spine's and the chest's
 * side-bending range together; the share that holds a torque solves that
 * piecewise-linear equation, the whole range when the torque passes what the
 * range holds.
 *
 * The torque an arm wrestler's shoulder resists with is its internal rotation
 * strength, 0.65 N m per kilogram of body mass at its eccentric peak
 * (Tasiopoulos et al. 2018, "Isokinetic characteristics of amateur boxer
 * athletes", Front Physiol 9:1597, Table 2, the male non-athlete controls at 60
 * degrees a second). It is provisional for women and for other speeds, which
 * that study did not measure.
 *
 * First pass: the stiffness is the passive trunk's, so the bend is the most a
 * relaxed trunk would give, not one braced by its muscles.
 */
export namespace HumanForceTrunk {
  /**
   * The trunk's lateral bending stiffness by quarter of its range, N m per
   * degree (Watt, Callaway and Williams 2022, Table 6).
   */
  export const LATERAL: readonly number[] = [0.32, 0.83, 2.03, 5.03];

  /**
   * The shoulder's eccentric internal-rotation peak torque per body mass, N m
   * per kilogram (Tasiopoulos et al. 2018, Table 2; male controls at 60 degrees
   * a second, provisional otherwise).
   */
  export const ROTATION: number = 0.65;

  /**
   * The trunk's side-bending range toward a side: the spine's and the chest's
   * ranges from upright to their ends on that side, together.
   *
   * @param body The body.
   * @param side The side bent toward.
   * @returns Degrees.
   */
  export function range(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): number {
    let sum: number = 0;
    for (const bone of ["spine", "chest"] as const) {
      const limits: ReturnType<typeof getConstraint> = getConstraint(
        bone,
        readHumanBone(body, bone)?.constraint ?? null,
      );
      const abduction:
        | NonNullable<ReturnType<typeof getConstraint>>["abduction"]
        | null = limits?.abduction ?? null;
      if (abduction === null || abduction === undefined) continue;
      sum +=
        side === "left" ? Math.abs(abduction.min) : Math.abs(abduction.max);
    }
    return sum;
  }

  /**
   * The share of the side-bending range at which the trunk holds a torque.
   *
   * @param torque Newton metres.
   * @param range The side-bending range, degrees.
   * @returns The share, in [0, 1].
   */
  export function share(torque: number, range: number): number {
    if (!(torque > 0) || !(range > 0)) return 0;
    const quarter: number = range / LATERAL.length;
    let left: number = torque;
    for (let q: number = 0; q < LATERAL.length; q++) {
      const holds: number = LATERAL[q]! * quarter;
      if (left <= holds) return (q + left / holds) / LATERAL.length;
      left -= holds;
    }
    return 1;
  }
}
