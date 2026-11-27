import type { IAutoMovieConstructionChartPoint } from "../construction/IAutoMovieConstructionChartPoint";

/** The paired chart addresses and outline controls of a digit nail. */
export namespace IAutoMovieHumanNailLoop {
  /** A nail's chart loop and its paired starting addresses on digit and plate. */
  export interface ILoop {
    /** The chart ellipse's centre `[station, phase]` on the digit. */
    centre: [number, number];

    /** Its semi-axes `[station, phase]`. */
    semi: [number, number];

    /** The curve's share of the ellipse at each column's clock. */
    shape: number[];

    /** The plate's chart point on the curve at clock 0. */
    part: IAutoMovieConstructionChartPoint;

    /** The digit's chart point on the curve at clock 0. */
    host: IAutoMovieConstructionChartPoint;
  }
}
