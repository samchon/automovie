/**
 * Explicit unit shared by one system's capacity and port demand declarations.
 *
 * @evidence contracts/development/design.md#principled-representation Medium-unit admission permits volumetric flow for fluid/air, watt or ampere for power, bandwidth for data and dimensionless control, requiring each port to equal its system unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Closed units prevent incomparable capacity and demand sums without introducing wrapper numeric types or implicit conversion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The validator performs no voltage or media conversion, and other medium accepts a declared supported unit without pretending to derive domain physics.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the quantity basis used consistently for capacity and demand comparisons.
 */
export type AutoMovieServiceUnit =
  | "cubic-meter-per-second"
  | "watt"
  | "ampere"
  | "bit-per-second"
  | "dimensionless";
