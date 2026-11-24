import type { IAutoMovieHumanLegSectionProportion } from "@automovie/interface";

/**
 * A circular section is the independent baseline when a girth gives neither
 * breadth nor depth. The circle is symmetric under reflection and has perimeter
 * pi times its box width. Later skin and tissue laws can supply explicit local
 * departures.
 */
export namespace AutoMovieHumanLegSectionProportion {
  /** Circular fullness as a fraction of the rhombus-to-box perimeter interval. */
  const FULLNESS: number = (Math.PI - 2 * Math.SQRT2) / (4 - 2 * Math.SQRT2);

  /** Same law at both ends of the ankle-to-crotch fraction. */
  export const ROWS: readonly IAutoMovieHumanLegSectionProportion.IRow[] = [
    { share: 0, ratio: 1, fullness: FULLNESS },
    { share: 1, ratio: 1, fullness: FULLNESS },
  ];

  /** Breadth-to-depth ratio and circular fullness at any normalized height. */
  export function at(
    _share: number,
  ): IAutoMovieHumanLegSectionProportion.IAtResult {
    return { ratio: 1, fullness: FULLNESS };
  }

  /** Circular support box measured by a closed tape, millimetres. */
  export function box(
    girth: number,
    _share: number,
  ): IAutoMovieHumanLegSectionProportion.IBoxResult {
    const diameter: number = girth / Math.PI;
    return { breadth: diameter, depth: diameter };
  }
}
