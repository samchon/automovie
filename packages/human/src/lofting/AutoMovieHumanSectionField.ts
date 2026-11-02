import { AutoMovieHumanNaturalSpline } from "./AutoMovieHumanNaturalSpline";

/**
 * A chain's surface as a continuous field in station and phase.
 *
 * Each coordinate of a section is a real Fourier series in phase, and each
 * series coefficient is a natural cubic spline through a few anchor stations.
 * A dense section can so be read at any station and phase from sparse
 * numbers, and a chain's layers need not match its anchors.
 */
export namespace AutoMovieHumanSectionField {
  /** Sparse field of one chain, as a prior stores it. */
  export interface IField {
    /** Anchor stations, increasing, covering every station read. */
    stations: readonly number[];

    /**
     * Per anchor, the series of each coordinate `[a0, a1, b1, a2, b2, ...]`
     * one after the other, so a coordinate holds `length / 3` numbers.
     */
    series: readonly (readonly number[])[];
  }

  /** A field ready to read. */
  export interface ICompiled {
    /** One spline per series number. */
    splines: AutoMovieHumanNaturalSpline.ISpline[];

    /** Numbers of one coordinate's series. */
    width: number;
  }

  /** Build the station splines of a field. */
  export function compile(field: IField): ICompiled {
    const count: number = field.series[0]!.length;
    return {
      splines: Array.from(
        { length: count },
        (_: unknown, k: number): AutoMovieHumanNaturalSpline.ISpline =>
          AutoMovieHumanNaturalSpline.create(
            field.stations,
            field.series.map((row: readonly number[]): number => row[k]!),
          ),
      ),
      width: count / 3,
    };
  }

  /** Series numbers at a station, for reading several phases. */
  export function section(field: ICompiled, station: number): number[] {
    return field.splines.map(
      (s: AutoMovieHumanNaturalSpline.ISpline): number =>
        AutoMovieHumanNaturalSpline.evaluate(s, station),
    );
  }

  /**
   * Point of a section at a phase.
   *
   * @param series Numbers from {@link section}.
   * @param width Numbers of one coordinate's series.
   * @param t Phase, radians.
   */
  export function point(
    series: readonly number[],
    width: number,
    t: number,
  ): [number, number, number] {
    const out: [number, number, number] = [0, 0, 0];
    for (let c: number = 0; c < 3; c++) {
      const at: number = c * width;
      let v: number = series[at]!;
      for (let k: number = 1; 2 * k < width; k++)
        v +=
          series[at + 2 * k - 1]! * Math.cos(k * t) +
          series[at + 2 * k]! * Math.sin(k * t);
      out[c] = v;
    }
    return out;
  }
}
