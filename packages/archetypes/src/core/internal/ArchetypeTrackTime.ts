import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";

/*
 * Finite clock admission shared by mechanism tracks and their recoil consumer.
 */
export namespace ArchetypeTrackTime {
  /*
   * Admit positive duration and a representably later finite end.
   * Parameter archetype: The consumer's refusal name.
   * Parameter start: Finite film start, including negative seconds.
   * Parameter seconds: Finite positive duration, seconds.
   * Returns: The finite end strictly later than start.
   * At seconds for invalid duration or
   * start for unsupported interval.
   */
  export function end(
    archetype: string,
    start: number,
    seconds: number,
  ): number {
    if (!(seconds > 0) || seconds === Infinity)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "seconds",
        value: seconds,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: "a mechanism track needs a finite positive duration",
        fix: "give a positive finite duration in seconds",
      });
    const result: number = start + seconds;
    if (!(result > start) || result === Infinity)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "start",
        value: start,
        feasible: null,
        reason:
          "a mechanism needs finite film seconds with a representably later finite end",
        fix: "choose a finite start at which the duration remains representable",
      });
    return result;
  }

  /*
   * Read held elapsed time without subtracting outside the admitted interval.
   * Parameter archetype: The consumer's refusal name.
   * Parameter sample: Finite film sample seconds.
   * Parameter start: Admitted finite start.
   * Parameter end: Admitted finite end.
   * Parameter seconds: Admitted positive duration.
   * Returns: Zero before start, duration after end, or interior elapsed time.
   * If the sample cannot locate a film instant.
   */
  export function elapsed(
    archetype: string,
    sample: number,
    start: number,
    end: number,
    seconds: number,
  ): number {
    if (sample <= start && sample !== -Infinity) return 0;
    if (sample >= end && sample !== Infinity) return seconds;
    if (sample > start && sample < end) return sample - start;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "seconds",
      value: sample,
      feasible: null,
      reason: "the sample does not locate a finite film instant",
      fix: "read the track at a finite film second",
    });
  }

  /*
   * Exact rounding residual of an admitted start+duration sum.
   * Parameter start: Admitted finite start.
   * Parameter seconds: Admitted positive duration.
   * Parameter end: Their admitted rounded sum.
   * Returns: The low part of the exact sum, seconds.
   */
  export function roundingError(
    start: number,
    seconds: number,
    end: number,
  ): number {
    const a: number = Math.abs(start) >= Math.abs(seconds) ? start : seconds;
    const b: number = a === start ? seconds : start;
    return b - (end - a);
  }

  /*
   * Place a crossing from its nearer time endpoint without collapsing an
   * interior event.
   * Parameter archetype: The consumer's refusal name.
   * Parameter start: Admitted start.
   * Parameter end: Admitted end.
   * Parameter seconds: Admitted duration.
   * Parameter offset: Seconds from the selected endpoint.
   * Parameter fromEnd: Offset is backward from end when true, forward from start
   * otherwise.
   * Parameter error: Prepared end residual for backward offsets.
   * Returns: A held endpoint or a representably interior finite instant.
   * For unsupported offset or interior
   * clock resolution.
   */
  export function instant(
    archetype: string,
    start: number,
    end: number,
    seconds: number,
    offset: number,
    fromEnd: boolean = false,
    error: number = 0,
  ): number {
    const result: number =
      offset === 0
        ? fromEnd
          ? end
          : start
        : offset === seconds
          ? fromEnd
            ? start
            : end
          : fromEnd
            ? end + (error - offset)
            : start + offset;
    if (
      !(
        offset >= 0 &&
        offset <= seconds &&
        (offset === 0 || offset === seconds || (result > start && result < end))
      )
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "launch",
        value: offset,
        feasible: null,
        reason:
          "the event has no representable instant inside the film interval",
        fix: "use a clock interval that can represent the crossing instant",
      });
    return result;
  }
}
