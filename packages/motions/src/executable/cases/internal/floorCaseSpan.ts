import type { IMotionCaptureCase } from "../../internal/IMotionCaptureCase";

/** The record of `IFloorCaseSpanRange`'s site. */
interface IFloorCaseSpanRange {
  /** The lowest height measured, metres. */
  low: number;

  /** The highest height measured, metres. */
  high: number;
}

/**
 * A verdict that a measured range of heights lies within -10 to +15 mm of the
 * floor: a lying body's contact allows its skin 10 mm into the floor and 15 mm
 * above it, the floor cases' contact band.
 *
 * @param name The check.
 * @param range The lowest and highest heights measured, metres.
 * @returns The verdict, showing the range in millimetres.
 */
export function floorCaseSpan(
  name: string,
  range: IFloorCaseSpanRange,
): IMotionCaptureCase.IVerdict {
  return {
    name,
    passed: range.low >= -0.01 && range.high <= 0.015,
    detail: `${(range.low * 1000).toFixed(1)} to ${(range.high * 1000).toFixed(1)} mm (band -10.0 to 15.0 mm)`,
  };
}
