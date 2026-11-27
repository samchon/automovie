/*
 * Spell one non-negative integer millisecond offset as a WebVTT timestamp,
 * `hh:mm:ss.ttt`.
 *
 * Hours always carry at least two digits and grow past two after 99 hours,
 * which WebVTT allows; minutes and seconds carry two digits and milliseconds
 * three, so one cue boundary has exactly one spelling on every host. The caller
 * passes an integer from `productionFrameIntervalToGridTicks`; a fractional or
 * negative input would produce an invalid timestamp.
 */
export const webVttTime: (milliseconds: number) => string = (
  milliseconds: number,
): string => {
  const hours: number = Math.floor(milliseconds / 3_600_000);
  const minutes: number = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds: number = Math.floor((milliseconds % 60_000) / 1_000);
  const fraction: number = milliseconds % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
};
