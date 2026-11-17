import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * Finite clock admission shared by mechanism tracks and their recoil consumer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the finite interval, represented event and sample-clock purpose.
 * @evidence contracts/development/design.md#principled-representation Film seconds remain scalar numbers; a prepared sum residual preserves end-relative time without changing the public start/end representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Internal end, elapsed, residual and event-instant operations serve swing/ease/recoil without a public clock type or barrel extension.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No time cap, epsilon, substituted start or acceptance of nonfinite samples.
 */
export namespace ArchetypeTrackTime {
  /**
   * Admit positive duration and a representably later finite end.
   *
   * @param archetype The consumer's refusal name.
   * @param start Finite film start, including negative seconds.
   * @param seconds Finite positive duration, seconds.
   * @returns The finite end strictly later than start.
   * @throws {ArchetypeRefusal} At seconds for invalid duration or start for unsupported interval.
   * @evidence contracts/development/common.md#meaningful-documentation States units, negative-start support and end/duration admission.
   * @evidence contracts/development/implementation.md#principled-implementation The public end is start+duration under binary64 and must remain finite and strictly later so a represented interval exists.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit duration, compute end, admit interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nudging, cap or replacement hides an unsupported clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One prepared interval serves each reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained input or resource.
   */
  export function end(
    archetype: string,
    start: number,
    seconds: number,
  ): number {
    if (!(Number.isFinite(seconds) && seconds > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "seconds",
        value: seconds,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: "a mechanism track needs a finite positive duration",
        fix: "give a positive finite duration in seconds",
      });
    const result: number = start + seconds;
    if (!(Number.isFinite(start) && Number.isFinite(result) && result > start))
      throw new ArchetypeRefusal({
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

  /**
   * Read held elapsed time without subtracting outside the admitted interval.
   *
   * @param archetype The consumer's refusal name.
   * @param sample Finite film sample seconds.
   * @param start Admitted finite start.
   * @param end Admitted finite end.
   * @param seconds Admitted positive duration.
   * @returns Zero before start, duration after end, or interior elapsed time.
   * @throws {ArchetypeRefusal} At seconds for a nonfinite sample.
   * @evidence contracts/development/common.md#meaningful-documentation States admitted interval premises, sample domain and held offsets.
   * @evidence contracts/development/implementation.md#principled-implementation Boundary comparisons precede subtraction, so distant finite samples cannot overflow an offset before selecting the held endpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit sample, hold boundaries, subtract inside.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite samples refuse instead of becoming held ends.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the prepared interval without rebuilding it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained input or allocation on admitted reads.
   */
  export function elapsed(
    archetype: string,
    sample: number,
    start: number,
    end: number,
    seconds: number,
  ): number {
    if (!Number.isFinite(sample))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "seconds",
        value: sample,
        feasible: null,
        reason: "a mechanism sample needs a finite film second",
        fix: "sample the track at a finite film second",
      });
    if (sample <= start) return 0;
    if (sample >= end) return seconds;
    return sample - start;
  }

  /**
   * Exact rounding residual of an admitted start+duration sum.
   *
   * @param start Admitted finite start.
   * @param seconds Admitted positive duration.
   * @param end Their admitted rounded sum.
   * @returns The low part of the exact sum, seconds.
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted-sum premise and residual meaning.
   * @evidence contracts/development/implementation.md#principled-implementation Absolute-magnitude ordering satisfies FastTwoSum. b-(end-a) recovers the low part while avoiding general TwoSum's potentially overflowing end-start on opposite-sign clocks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Order addends and recover the residual.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No epsilon, shifted clock or residual clamp changes the sum.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Prepared once for subsequent remaining-time reads.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * Place a crossing from its nearer time endpoint without collapsing an interior event.
   *
   * @param archetype The consumer's refusal name.
   * @param start Admitted start.
   * @param end Admitted end.
   * @param seconds Admitted duration.
   * @param offset Seconds from the selected endpoint.
   * @param fromEnd Offset is backward from end when true, forward from start otherwise.
   * @param error Prepared end residual for backward offsets.
   * @returns A held endpoint or a representably interior finite instant.
   * @throws {ArchetypeRefusal} For unsupported offset or interior clock resolution.
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint direction, residual and event representability.
   * @evidence contracts/development/implementation.md#principled-implementation End-relative events use end+(error-offset), preserving the end residual before final clock addition. A strict interior offset must remain strict on the represented clock; exact endpoint events use the prepared endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the anchored instant, then admit offset and interior placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No event nudge or time epsilon hides unavailable clock resolution.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the prepared end and residual.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained input or resource.
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
        Number.isFinite(offset) &&
        offset >= 0 &&
        offset <= seconds &&
        Number.isFinite(result) &&
        (offset === 0 || offset === seconds || (result > start && result < end))
      )
    )
      throw new ArchetypeRefusal({
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
