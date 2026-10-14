/**
 * Spell one non-negative integer millisecond offset as a WebVTT timestamp,
 * `hh:mm:ss.ttt`.
 *
 * Hours always carry at least two digits and grow past two after 99 hours,
 * which WebVTT allows; minutes and seconds carry two digits and milliseconds
 * three, so one cue boundary has exactly one spelling on every host. The
 * caller passes an integer from `productionFrameIntervalToGridTicks`; a
 * fractional or negative input would produce an invalid timestamp.
 *
 * @evidence contracts/common.md#principled-implementation Integer division and remainder by 3,600,000, 60,000 and 1,000 decompose the offset exactly because every input is a non-negative safe integer from the BigInt tick mapping, and zero padding yields the fixed-width fields the WebVTT timestamp production requires.
 * @evidence contracts/common.md#clear-and-simple-design The function only spells a timestamp; frame-to-millisecond rounding stays in the engine mapping that owns it, so the spelling never decides a boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The always-present hour field is the WebVTT long form chosen for one canonical spelling, not a per-file case, and the input premise is documented rather than silently rounded.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the unit, the field widths including hour growth, the canonical-spelling reason, and the integer premise with its failure effect.
 * @evidence contracts/performance.md#efficient-algorithms Four arithmetic steps and four short pads run in constant time per boundary.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Spelling one number coordinates no phases and leaves nothing a later call could reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function holds no state, handle or task beyond the short string it returns.
 */
export const webVttTime: (milliseconds: number) => string = (milliseconds: number): string => {
  const hours: number = Math.floor(milliseconds / 3_600_000);
  const minutes: number = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds: number = Math.floor((milliseconds % 60_000) / 1_000);
  const fraction: number = milliseconds % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
};
