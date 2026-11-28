import type { AutoMovieVector2Tuple } from "../index";
import type { IAutoMovieCurveDomain } from "./IAutoMovieCurveDomain";

/**
 * Borrowed planar millimetre evaluator with an original parameter domain, chart
 * breaks and explicit one-sided derivative queries.
 *
 * Provide deterministic callbacks for valid queries. Retained observations are
 * copied, while callback state and source geometry remain caller-owned.
 */
export interface IAutoMoviePlanarCurveSource {
  /**
   * Inclusive strictly increasing finite interval in the source's native
   * parameter.
   */
  domain: IAutoMovieCurveDomain;

  /**
   * Finite parameter boundaries strictly inside the full interval. A fitted
   * smooth piece cannot cross a declared break.
   */
  breaks: readonly number[];

  /**
   * Whether the source identifies the two ends of its full domain as one closed
   * curve.
   */
  closed: boolean;

  /**
   * Return one XY position in millimetres for the supplied source parameter.
   *
   * @param t Parameter inside the declared interval.
   * @returns XY in millimetres in the source chart.
   */
  evaluate(t: number): Readonly<AutoMovieVector2Tuple>;

  /**
   * Return an XY derivative of the requested order in millimetres per source
   * parameter unit to that order. An explicit side selects the incident chart
   * at a break.
   *
   * At a nonsmooth break, give the exact requested incident chart endpoint
   * value. Omitting side uses the callback's ordinary point convention.
   *
   * @param t Parameter in the declared source interval.
   * @param order Requested derivative order from one through five.
   * @param side Incident chart side for a one-sided query.
   * @returns XY derivative in the source chart and parameter units.
   */
  derivative(
    t: number,
    order: 1 | 2 | 3 | 4 | 5,
    side?: "left" | "right",
  ): Readonly<AutoMovieVector2Tuple>;
}
