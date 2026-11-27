import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";

import { HumanRefusal } from "../HumanRefusal";

/*
 * The numeric bounds of an action's parameters, each a check that refuses with
 * the range it accepts.
 *
 * Every law bounds its counts, its seconds and its shares the same few ways: a
 * positive whole number, a value not below a floor, a value above one, a value
 * inside a band. Stating a bound through this owner gives every such refusal
 * the same shape (the axis, the value given, the accepted range and the
 * instruction to set the axis inside it), which is what lets a coding agent
 * repair any of them the same way.
 *
 * A bound passes a value that satisfies it and throws otherwise; `NaN`
 * satisfies none.
 */
export namespace HumanBound {
  /*
   * A count: the value rounded to the nearest whole number, not below a floor.
   * Parameter axis: The parameter's name.
   * Parameter value: The value given.
   * Parameter minimum: The least count; 1 when absent.
   * Returns: The whole count.
   * When the count is below the floor.
   */
  export function whole(
    axis: string,
    value: number,
    minimum: number = 1,
  ): number {
    const count: number = Math.round(value);
    if (count >= minimum) return count;
    throw refuse(axis, value, {
      kind: "range",
      minimum,
      maximum: null,
      unit: "",
      whole: true,
    });
  }

  /*
   * A value not below a floor.
   * Parameter axis: The parameter's name.
   * Parameter value: The value given.
   * Parameter minimum: The floor.
   * Parameter unit: The unit of the value; a pure number when absent.
   * Returns: The value.
   * When the value is below the floor or not finite.
   */
  export function least(
    axis: string,
    value: number,
    minimum: number,
    unit: string = "",
  ): number {
    if (value >= minimum) return value;
    throw refuse(axis, value, { kind: "range", minimum, maximum: null, unit });
  }

  /*
   * A value above a floor that is itself excluded.
   * Parameter axis: The parameter's name.
   * Parameter value: The value given.
   * Parameter minimum: The excluded floor.
   * Parameter unit: The unit of the value; a pure number when absent.
   * Returns: The value.
   * When the value is not above the floor or not finite.
   */
  export function above(
    axis: string,
    value: number,
    minimum: number,
    unit: string = "",
  ): number {
    if (value > minimum) return value;
    throw refuse(axis, value, {
      kind: "range",
      minimum,
      maximum: null,
      unit,
      open: "minimum",
    });
  }

  /*
   * A value inside a band.
   * Parameter axis: The parameter's name.
   * Parameter value: The value given.
   * Parameter minimum: The band's lower end.
   * Parameter maximum: The band's upper end.
   * Parameter unit: The unit of the value; a pure number when absent.
   * Parameter open: Which ends are excluded; none when absent.
   * Returns: The value.
   * When the value lies outside the band.
   */
  export function within(
    axis: string,
    value: number,
    minimum: number,
    maximum: number,
    unit: string = "",
    open?: IAutoMovieMotionHumanRefusal.IRange["open"],
  ): number {
    const low: boolean =
      open === "minimum" || open === "both"
        ? value > minimum
        : value >= minimum;
    const high: boolean =
      open === "maximum" || open === "both"
        ? value < maximum
        : value <= maximum;
    if (low && high) return value;
    throw refuse(axis, value, {
      kind: "range",
      minimum,
      maximum,
      unit,
      ...(open === undefined ? {} : { open }),
    });
  }

  /*
   * The refusal of a value outside a range.
   */
  function refuse(
    axis: string,
    value: number,
    feasible: IAutoMovieMotionHumanRefusal.IRange,
  ): IAutoMovieMotionHumanRefusal {
    const accepted: string = HumanRefusal.describe(feasible);
    return new HumanRefusal({
      kind: "parameter",
      axis,
      value,
      feasible,
      reason: `${value}${feasible.unit === "" ? "" : ` ${feasible.unit}`} is outside what ${axis} accepts`,
      fix: `set ${axis} to ${accepted}`,
    });
  }
}
