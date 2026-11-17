import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";
/**
 * Call-local reader of four dimensionless shoulder shares or departures at a physical station in millimetres. The order follows the four +u/+v/-u/-v quarter intervals. Missing authored departures produce [0,0,0,0]; a failed declared outline reports and yields NaN in its own slot.
 *
 * @evidence contracts/development/design.md#principled-representation One station query preserves independent scalar ownership for every quarter instead of deriving quarter values from a fitted section.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The factory composes its four already-prepared scalar readers and returns a fresh tuple for each query.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constant-zero absence rule applies only to unstated departures, never to a failed declared source.
 * @evidence contracts/development/common.md#meaningful-documentation Defines units, quarter order, absence semantics, per-slot failure and returned tuple ownership.
 */
export type AutoMovieViewLoftInputsQuarters = (station: number) => IAutoMovieViewPart.IQuarters<number>;
