import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/** Exact integer ticks for a constant-rate frame grid on a native clock. */
export namespace AutoMovieEngineFrameClock {
  /**
   * Admit a ratio with two positive safe integer terms. Unreduced ratios keep
   * their original terms. A caller parsing text must admit the integer syntax
   * before converting the terms to numbers.
   *
   * @param value The proposed numerator and denominator pair.
   * @returns Whether both terms can be used as exact integers.
   */
  export function isRatio(
    value: unknown,
  ): value is IAutoMovieDeliveryContentAudit.Ratio {
    return (
      Array.isArray(value) &&
      value.length === 2 &&
      positiveInteger(value[0]) &&
      positiveInteger(value[1])
    );
  }

  /**
   * Derive an exact native tick count for one commissioned frame. A frame
   * requiring a fractional tick or exceeding the safe integer range returns
   * null. Both ratios must have positive safe integer terms.
   *
   * @param timeBase Native seconds per tick as numerator over denominator.
   * @param frameRate Commissioned frames per second as numerator over
   *   denominator.
   * @returns The positive safe integer ticks per frame, or null.
   */
  export function ticksPerFrame(
    timeBase: IAutoMovieDeliveryContentAudit.Ratio,
    frameRate: IAutoMovieDeliveryContentAudit.Ratio,
  ): number | null {
    if (!isRatio(timeBase) || !isRatio(frameRate)) return null;

    const numerator: bigint = BigInt(timeBase[1]) * BigInt(frameRate[1]);
    const denominator: bigint = BigInt(timeBase[0]) * BigInt(frameRate[0]);
    if (numerator % denominator !== 0n) return null;
    const step: bigint = numerator / denominator;
    return step <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(step) : null;
  }

  /**
   * Locate a zero-based boundary on an exact native frame grid. Negative or
   * unsafe positions, invalid ticks per frame, and overflow return null.
   *
   * @param frame Frame boundary index, with zero at the start of the grid.
   * @param step Native ticks per frame from {@link ticksPerFrame}.
   * @returns The boundary's safe integer tick, or null.
   */
  export function boundary(frame: number, step: number): number | null {
    if (!Number.isSafeInteger(frame) || frame < 0 || !positiveInteger(step))
      return null;

    const tick: bigint = BigInt(frame) * BigInt(step);
    return tick <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(tick) : null;
  }
}

/*
 * Check a number before using it as a positive integer clock term.
 */
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
