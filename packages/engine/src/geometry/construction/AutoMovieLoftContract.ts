/**
 * The values chains and seams exchange, each made only by a constructor that
 * checks its contract and throws a message naming the producer, the layer and
 * the contract it broke.
 *
 * TypeScript's `number` states neither finiteness nor order, so a shared
 * module that assumes them (a natural spline dividing by its station gaps, a
 * chain builder dating its layers) fails far from the producer that broke the
 * assumption: a head chain whose layers stood 0.05 mm apart swung its spline
 * into lobes hundreds of millimetres wide, and the failure surfaced only in
 * the skin chart. The brand on each type records that its constructor ran, so
 * a consumer that takes the branded type cannot receive an unchecked value.
 *
 * - Stations: finite, strictly increasing by at least a stated step, in
 *   millimetres; at least two.
 * - Jet: finite numbers within a stated magnitude (a layer's values, slopes or
 *   curvatures per millimetre of station).
 * - Ring: finite points `[x, y, z]` in millimetres whose projection on the
 *   horizontal plane encloses a non-zero area.
 *
 * Every check throws; none clamps, so a broken producer is named where it
 * broke the contract.
 */
export namespace AutoMovieLoftContract {
  /**
   * A contract an optional piece broke, recorded instead of aborting the
   * figure: the piece is replaced by its base (no piece over the base
   * envelope; an aperture that cannot close one loop leaves the mouth closed).
   */
  export interface IDiagnostic {
    /** The piece that broke the contract, such as `human.mouth`. */
    producer: string;

    /** Its construction level (`construction-levels.md`). */
    level: number;

    /** The contract it broke. */
    contract: string;

    /** The message with its numbers. */
    detail: string;
  }

  /** Stations a constructor checked: finite, strictly increasing by at least its stated step, mm. */
  export type Stations = readonly number[] & { readonly contract: "stations" };

  /** Numbers a constructor checked: finite and within its stated magnitude. */
  export type Jet = readonly number[] & { readonly contract: "jet" };

  /** A ring a constructor checked: finite points enclosing a non-zero horizontal area, mm. */
  export type Ring = readonly (readonly [number, number, number])[] & { readonly contract: "ring" };

  /**
   * Stations checked against their contract.
   *
   * @param producer The chain or seam that made them, for the message.
   * @param values Stations, millimetres.
   * @param least Least rise between two stations, millimetres, positive.
   * @returns The same values, branded.
   * @throws When fewer than two, one is not finite, or one rises by less than `least`.
   */
  export function stations(producer: string, values: readonly number[], least: number): Stations {
    if (!(least > 0)) throw new Error(`${producer}: a station list needs a positive least step, not ${least}`);
    if (values.length < 2) throw new Error(`${producer}: a station list needs two stations, not ${values.length}`);
    for (let k: number = 0; k < values.length; k++) {
      const v: number = values[k]!;
      if (!Number.isFinite(v)) throw new Error(`${producer}: layer ${k} stands at ${v}, not a finite station in millimetres`);
      if (k > 0 && !(v - values[k - 1]! >= least))
        throw new Error(
          `${producer}: layer ${k} stands ${v - values[k - 1]!} mm over layer ${k - 1}; stations must rise by at least ${least} mm`,
        );
    }
    return values as Stations;
  }

  /**
   * Numbers checked to be finite and within a magnitude.
   *
   * @param producer The chain, layer and quantity, for the message.
   * @param values The numbers.
   * @param bound Largest magnitude accepted, positive.
   * @returns The same values, branded.
   * @throws When an entry is not finite or exceeds `bound`.
   */
  export function jet(producer: string, values: readonly number[], bound: number): Jet {
    for (let i: number = 0; i < values.length; i++)
      if (!(Math.abs(values[i]!) <= bound))
        throw new Error(`${producer}: entry ${i} is ${values[i]}, outside the finite bound ${bound}`);
    return values as Jet;
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
  ): Ring {
    let area: number = 0;
    for (let i: number = 0; i < points.length; i++) {
      const p: readonly [number, number, number] = points[i]!;
      if (!(Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])))
        throw new Error(`${producer}: layer ${layer} point ${i} is [${p.join(", ")}], not finite`);
      const q: readonly [number, number, number] = points[(i + 1) % points.length]!;
      area += p[0] * q[2] - q[0] * p[2];
    }
    if (!(Math.abs(area) > 0)) throw new Error(`${producer}: layer ${layer}'s ring of ${points.length} points encloses no area`);
    return points as Ring;
  }

  /**
   * Least rise between two layers of a chain built from rings, mm: the gap
   * `AutoMovieHumanHorizontalChain` has always kept, now a contract its
   * producers meet instead of a clamp it applies.
   */
  export const LEAST_LAYER_GAP: number = 0.05;

  /**
   * Least rise between two stations of a chain made C2 by its natural spline,
   * mm: the spline divides by the gaps and their squares, and a micrometre
   * keeps those far within a double's range for millimetre coefficients.
   */
  export const LEAST_SPLINE_GAP: number = 1e-3;

  /**
   * Largest magnitude of a station jet that the contract accepts: the largest
   * finite double. A jet checked against it is finite; a producer with a
   * tighter physical bound passes its own.
   */
  export const FINITE: number = Number.MAX_VALUE;
}
