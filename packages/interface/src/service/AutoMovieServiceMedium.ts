/**
 * What a system carries.
 *
 * `other` is the deliberate escape hatch: a production carrying medical gas,
 * compressed air or vacuum states `other` and takes the unit check with it,
 * rather than waiting for this union to grow.
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
