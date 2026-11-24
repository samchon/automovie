import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/** The admitted authored-flight mode of a performance input. */
export type HumanPerformanceFlightMode = NonNullable<
  IAutoMovieMotionHumanPerformance.IInput["flight"]
>;

/**
 * A performance input's authored-flight mode, captured once from its effective
 * property and admitted: the input's own enumerable `flight` as a spread copies
 * it, otherwise one ordinary read of `input.flight` (an inherited or
 * non-enumerable property), with an absent mode taken as `staged`.
 */
export namespace HumanPerformanceFlightMode {
  /**
   * The input's admitted flight mode.
   *
   * @param input The input.
   * @returns `staged` or `physical`.
   * @throws {HumanRefusal} When the effective flight mode is neither staged nor
   *   physical after the undefined default.
   */
  export function of(
    input: IAutoMovieMotionHumanPerformance.IInput,
  ): HumanPerformanceFlightMode {
    const copied: IAutoMovieMotionHumanPerformance.IInput = { ...input };
    const selected: IAutoMovieMotionHumanPerformance.IInput["flight"] =
      Object.prototype.hasOwnProperty.call(copied, "flight")
        ? copied.flight
        : input.flight;
    const flight: HumanPerformanceFlightMode =
      selected === undefined ? "staged" : selected;
    if (flight !== "staged" && flight !== "physical")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "flight",
        value: flight,
        reason: "the authored-flight mode must be staged or physical",
        fix: "choose staged for authored turns or physical for angular-momentum flight",
      });
    return flight;
  }
}
