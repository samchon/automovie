/**
 * What a system carries.
 *
 * `other` is the deliberate escape hatch: a production carrying medical gas, compressed air or vacuum states `other` and takes the unit check with it, rather than waiting for this union to grow.
 *
 * @evidence contracts/common.md#principled-implementation Medium selects the admitted discipline and capacity/demand unit family, and every port repeats its system's exact medium before segments can join.
 * @evidence contracts/common.md#clear-and-simple-design A closed carried-quantity vocabulary is independent from graph direction and computational node kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Other deliberately bypasses the medium-specific unit restriction but does not add a solver or license inconsistent port/system units.
 * @evidence contracts/common.md#meaningful-documentation Defines carried-medium identity and the explicit other-medium escape with its limited unit-check effect.
 * @author Samchon
 */
export type AutoMovieServiceMedium =
  | "cold-water"
  | "hot-water"
  | "waste-water"
  | "vent-air"
  | "supply-air"
  | "return-air"
  | "exhaust-air"
  | "electric-power"
  | "data-signal"
  | "control-signal"
  | "fire-water"
  | "other";
