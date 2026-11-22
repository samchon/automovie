/**
 * The unit of a band and of the dimension it bounds: `m`, `kg`, `degrees`, `N`, `m/s` for a speed, `s` for a time, or empty for a ratio or a count.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each unit and what the empty unit stands for.
 * @evidence contracts/development/design.md#principled-representation A closed list of the units the producers' bands use, so a refusal can print the unit beside the range.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IAutoMovieArchetypeBand.unit` and by the draw session's per-dimension unit table; one list serves both.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No free-text unit: a band and a dimension declaration cannot name different units.
 */
export type AutoMovieArchetypeBandUnit =
  | "m"
  | "kg"
  | "degrees"
  | "N"
  | "m/s"
  | "s"
  | "";
