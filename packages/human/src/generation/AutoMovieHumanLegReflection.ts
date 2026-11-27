import { AutoMovieEngineSplineCurve } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLegAxis,
  IAutoMovieHumanLegReflection,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";

/**
 * The right leg as the left's reflection (rule J6).
 *
 * Reflection reverses polar phase: the right leg's point at phase t is the
 * mirror of the canonical point at -t, its in-plane axis `v` turned over so
 * that sections keep their sense round the chain. The ankle and crotch keys are
 * read in the canonical frame through the same reflection, so both legs come
 * from one family.
 */
export namespace AutoMovieHumanLegReflection {
  /**
   * A canonical frame, or its station derivative, on a side: the origin and `u`
   * mirrored, and `v` mirrored and turned over, a linear map either way.
   *
   * @param f The canonical frame.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function placed(
    f: IAutoMovieHumanLegAxis.IFrame,
    sign: 1 | -1,
  ): IAutoMovieLoftSectionFrame {
    return {
      origin: [f.origin[0], f.origin[1], sign * f.origin[2]],
      u: [f.u[0], f.u[1], sign * f.u[2]],
      v: [sign * f.v[0], sign * f.v[1], f.v[2]],
    };
  }

  /**
   * Control values of canonical in-plane samples on a side.
   *
   * @param local Section points `[x, z, lift]` in the canonical plane, one per
   *   phase.
   * @param sign 1 for the left side, -1 for the right.
   */
  export function sided(
    local: readonly AutoMovieVector3Tuple[],
    sign: 1 | -1,
  ): IAutoMovieHumanLegReflection.ISidedResult {
    const order: number = AutoMovieHumanLegSampling.ORDER;
    function read(m: number): AutoMovieVector3Tuple {
      return local[sign === 1 ? m : (order - m) % order]!;
    }
    const samples: AutoMovieVector3Tuple[] = local.map(
      (_: AutoMovieVector3Tuple, m: number): AutoMovieVector3Tuple => read(m),
    );
    return {
      coefficients: AutoMovieEngineSplineCurve.interpolate(
        samples.map((p: AutoMovieVector3Tuple): [number, number] => [
          p[0],
          sign * p[1],
        ]),
      ),
      lift: AutoMovieEngineSplineCurve.interpolate(
        samples.map((p: AutoMovieVector3Tuple): [number, number] => [p[2], 0]),
      ).slice(0, order),
    };
  }
}
