import { HumanRefusal } from "./HumanRefusal";

/**
 * The numeric bounds of an action's parameters, each a check that refuses
 * with the range it accepts.
 *
 * Every law bounds its counts, its seconds and its shares the same few ways:
 * a positive whole number, a value not below a floor, a value above one, a
 * value inside a band. Stating a bound through this owner gives every such
 * refusal the same shape (the axis, the value given, the accepted range and
 * the instruction to set the axis inside it), which is what lets a coding
 * agent repair any of them the same way.
 *
 * A bound passes a value that satisfies it and throws otherwise; `NaN`
 * satisfies none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the checks share, why they have one owner and what passes.
 * @evidence contracts/development/implementation.md#principled-implementation Each check is one comparison and one refusal composed from the bound itself.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four checks over one refusing helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The feasible range reported is the range tested, built from the same arguments.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache: each call checks its own value.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure functions that retain nothing.
 */
export namespace HumanBound {
  /**
   * A count: a whole number not below a floor.
   *
   * @param axis The parameter's name.
   * @param value The value given.
   * @param minimum The least count; 1 when absent.
   * @returns The value.
   * @throws {HumanRefusal} When the value is not a whole number or is below the floor.
   */
  export function whole(
    axis: string,
    value: number,
    minimum: number = 1,
  ): number {
    if (Number.isInteger(value) && value >= minimum) return value;
    throw refuse(axis, value, {
      kind: "range",
      minimum,
      maximum: null,
      unit: "",
      whole: true,
    });
  }

  /**
   * A value not below a floor.
   *
   * @param axis The parameter's name.
   * @param value The value given.
   * @param minimum The floor.
   * @param unit The unit of the value; a pure number when absent.
   * @returns The value.
   * @throws {HumanRefusal} When the value is below the floor or not finite.
   */
  export function least(
    axis: string,
    value: number,
    minimum: number,
    unit: string = "",
  ): number {
    if (Number.isFinite(value) && value >= minimum) return value;
    throw refuse(axis, value, { kind: "range", minimum, maximum: null, unit });
  }

  /**
   * A value above a floor that is itself excluded.
   *
   * @param axis The parameter's name.
   * @param value The value given.
   * @param minimum The excluded floor.
   * @param unit The unit of the value; a pure number when absent.
   * @returns The value.
   * @throws {HumanRefusal} When the value is not above the floor or not finite.
   */
  export function above(
    axis: string,
    value: number,
    minimum: number,
    unit: string = "",
  ): number {
    if (Number.isFinite(value) && value > minimum) return value;
    throw refuse(axis, value, {
      kind: "range",
      minimum,
      maximum: null,
      unit,
      open: "minimum",
    });
  }

  /**
   * A value inside a band.
   *
   * @param axis The parameter's name.
   * @param value The value given.
   * @param minimum The band's lower end.
   * @param maximum The band's upper end.
   * @param unit The unit of the value; a pure number when absent.
   * @param open Which ends are excluded; none when absent.
   * @returns The value.
   * @throws {HumanRefusal} When the value lies outside the band.
   */
  export function within(
    axis: string,
    value: number,
    minimum: number,
    maximum: number,
    unit: string = "",
    open?: HumanRefusal.IRange["open"],
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

  /** The refusal of a value outside a range. */
  function refuse(
    axis: string,
    value: number,
    feasible: HumanRefusal.IRange,
  ): HumanRefusal {
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
