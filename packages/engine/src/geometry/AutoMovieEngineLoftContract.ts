import type { IAutoMovieLoftContract } from "@automovie/interface";

/**
 * Checked values chains and seams exchange; failed checks throw a message
 * naming the producer and the violated local premise.
 *
 * TypeScript's `number` states neither finiteness nor order, so a shared module
 * that assumes them (a natural spline dividing by its station gaps, a chain
 * builder dating its layers) fails far from the producer that broke the
 * assumption: a head chain whose layers stood 0.05 mm apart swung its spline
 * into lobes hundreds of millimetres wide, and the failure surfaced only in the
 * skin chart. The brand records an intended checking boundary in TypeScript; a
 * cast can bypass it and mutating a borrowed input can invalidate it.
 *
 * - Stations: finite, strictly increasing by at least a stated step, in
 *   millimetres; at least two.
 * - Jet: finite numbers within a stated magnitude (a layer's values, slopes or
 *   curvatures per millimetre of station).
 * - Ring: finite points `[x, y, z]` in millimetres whose projection on the
 *   horizontal plane encloses a non-zero area.
 *
 * Every check throws; none clamps, so a broken producer is named where it broke
 * the contract.
 */
export namespace AutoMovieEngineLoftContract {
  /**
   * Stations checked against their contract.
   *
   * @param producer The chain or seam that made them, for the message.
   * @param values Stations, millimetres.
   * @param least Least rise between two stations, millimetres, positive and finite.
   * @returns The same values, branded.
   * @throws When fewer than two, one is not finite, or one rises by less than
   *   `least`.
   */
  export function stations(
    producer: string,
    values: readonly number[],
    least: number,
  ): IAutoMovieLoftContract.Stations {
    if (!(least > 0) || !Number.isFinite(least))
      throw new Error(
        `${producer}: a station list needs a positive finite least step, not ${least}`,
      );
    if (values.length < 2)
      throw new Error(
        `${producer}: a station list needs two stations, not ${values.length}`,
      );
    for (let k: number = 0; k < values.length; k++) {
      const v: number = values[k]!;
      if (!Number.isFinite(v))
        throw new Error(`${producer}: layer ${k} has nonfinite station ${v}`);
      if (k > 0 && !(v - values[k - 1]! >= least))
        throw new Error(
          `${producer}: layer ${k} stands ${v - values[k - 1]!} mm over layer ${k - 1}; stations must rise by at least ${least} mm`,
        );
    }
    return values as IAutoMovieLoftContract.Stations;
  }

  /**
   * Numbers checked to be finite and within a magnitude.
   *
   * @param producer The chain, layer and quantity, for the message.
   * @param values The numbers.
   * @param bound Largest magnitude accepted; callers requiring finite entries
   *   pass a positive finite bound.
   * @returns The same values, branded.
   * @throws When an entry is not finite or exceeds `bound`.
   */
  export function jet(
    producer: string,
    values: readonly number[],
    bound: number,
  ): IAutoMovieLoftContract.Jet {
    for (let i: number = 0; i < values.length; i++)
      if (!(Math.abs(values[i]!) <= bound))
        throw new Error(
          `${producer}: entry ${i} is ${values[i]}, outside the finite bound ${bound}`,
        );
    return values as IAutoMovieLoftContract.Jet;
  }

  /**
   * A ring checked to have finite points and a non-zero horizontal area (the
   * shoelace sum of its points in `x` and `z`).
   *
   * @param producer The chain that made it, for the message.
   * @param layer The ring's layer index, for the message.
   * @param points The ring's points in order, millimetres.
   * @returns The same points, branded.
   * @throws When a coordinate is not finite or the ring encloses no area.
   */
  export function ring(
    producer: string,
    layer: number,
    points: readonly (readonly [number, number, number])[],
  ): IAutoMovieLoftContract.Ring {
    let area: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const [x, y, z] = points[i]!;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new Error(
          `${producer}: layer ${layer}'s ring point ${i} needs finite world coordinates`,
        );
      const q: readonly [number, number, number] =
        points[(i + 1) % points.length]!;
      area += x * q[2] - q[0] * z;
    }
    if (!(Math.abs(area) > 0))
      throw new Error(
        `${producer}: layer ${layer}'s ring of ${points.length} points encloses no area`,
      );
    return points as IAutoMovieLoftContract.Ring;
  }

  /**
   * Least rise between two layers of a chain built from rings, mm: the gap
   * `AutoMovieHumanHorizontalChain` has always kept, now a contract its
   * producers meet instead of a clamp it applies.
   */
  export const LEAST_LAYER_GAP: number = 0.05;

  /**
   * Least rise between two stations of a chain made C2 by its natural spline,
   * as a share of the stations' whole span: the spline divides by the gaps and
   * their squares. A millionth is a relative spacing policy for the supported
   * physical scales (a micrometre on a metre-long part, a nanometre on a
   * millimetre-long one), not a proof against overflow or underflow at every
   * finite double scale.
   */
  export const SPLINE_GAP_SHARE: number = 1e-6;

  /**
   * The least rise between two stations of a spline chain over these stations.
   *
   * @param values The stations, increasing, at least two.
   * @returns {@link SPLINE_GAP_SHARE} Of their span, mm.
   */
  export function splineGap(values: readonly number[]): number {
    return SPLINE_GAP_SHARE * Math.abs(values[values.length - 1]! - values[0]!);
  }

  /**
   * Largest magnitude of a station jet that the contract accepts: the largest
   * finite double. A jet checked against it is finite; a producer with a
   * tighter physical bound passes its own.
   */
  export const FINITE: number = Number.MAX_VALUE;
}
