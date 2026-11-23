import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Call-local reader of four dimensionless shoulder shares or departures at a
 * physical station in millimetres. The order follows the four +u/+v/-u/-v
 * quarter intervals. Missing authored departures produce [0,0,0,0]; a failed
 * declared outline reports and yields NaN in its own slot.
 */
export type AutoMovieViewLoftInputsQuarters = (
  station: number,
) => IAutoMovieViewPart.IQuarters<number>;
