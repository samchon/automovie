import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSplineCurve } from "../../lofting/AutoMovieHumanSplineCurve";
import type { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import type { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;

/**
 * The right leg as the left's reflection (rule J6).
 *
 * Reflection reverses polar phase: the right leg's point at phase t is the
 * mirror of the canonical point at -t, its in-plane axis `v` turned over so
 * that sections keep their sense round the chain. The ankle and crotch keys
 * are read in the canonical frame through the same reflection, so both legs
 * come from one family.
 */
export namespace AutoMovieHumanLegReflection {
  /**
   * A canonical frame, or its station derivative, on a side: the origin and
   * `u` mirrored, and `v` mirrored and turned over, a linear map either way.
   *
   * @param f The canonical frame.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function placed(f: AutoMovieHumanLegAxis.IFrame, sign: 1 | -1): AutoMovieHumanLoftFrame.IFrame {
    return {
      origin: [f.origin[0], f.origin[1], sign * f.origin[2]],
      u: [f.u[0], f.u[1], sign * f.u[2]],
      v: [sign * f.v[0], sign * f.v[1], f.v[2]],
    };
  }

  /**
   * Control values of canonical in-plane samples on a side.
   *
   * @param local Section points `[x, z, lift]` in the canonical plane, one per phase.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function sided(local: readonly Vec3[], sign: 1 | -1): { coefficients: number[]; lift: number[] } {
    const order: number = AutoMovieHumanLegSampling.ORDER;
    const read = (m: number): Vec3 => local[sign === 1 ? m : (order - m) % order]!;
    const samples: Vec3[] = local.map((_: Vec3, m: number): Vec3 => read(m));
    return {
      coefficients: AutoMovieHumanSplineCurve.interpolate(samples.map((p: Vec3): [number, number] => [p[0], sign * p[1]])),
      lift: AutoMovieHumanSplineCurve.interpolate(samples.map((p: Vec3): [number, number] => [p[2], 0])).slice(0, order),
    };
  }
}
