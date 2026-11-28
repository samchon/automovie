import type { IAutoMovieConstructionChartPoint } from "./IAutoMovieConstructionChartPoint";

/**
 * Closed host-chart loop with an authored centre and positive ellipse
 * semi-axes. Clock zero starts along the positive station direction. Optional
 * column shares scale its radius along each ellipse ray through a periodic
 * cubic. The host trim and exact band use this same continuous curve.
 */
export interface IAutoMovieConstructionPortLoop {
  /** Ellipse centre in host chart station metres and phase radians. */
  centre: IAutoMovieConstructionChartPoint;

  /**
   * Positive base ellipse semi-axes. Station is in metres and phase is in
   * radians less than π.
   */
  semi: {
    /** Semi-axis along station, metres. */
    stationMetres: number;
    /** Semi-axis along phase, radians; strictly between 0 and pi. */
    phaseRadians: number;
  };

  /**
   * Sign of the phase component at port clock π/2. Use +1 to follow positive
   * host phase and −1 for negative.
   */
  sense: 1 | -1;

  /**
   * Optional positive radial shares at uniform port clocks 2πk/count in column
   * order. A periodic cubic supplies the intervening values. Omission uses the
   * base ellipse.
   */
  shape?: number[];
}
