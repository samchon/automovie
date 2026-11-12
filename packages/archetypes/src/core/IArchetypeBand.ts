/**
 * The band one free dimension of an archetype may take, with the source that states it.
 *
 * A producer draws the dimension uniformly inside the band from its seed, takes the middle of the band without a seed, and refuses a value an author fixes outside it. The band is therefore the whole variation of that dimension: nothing an act reads leaves it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how a producer uses the band and what each member holds.
 * @evidence contracts/development/design.md#principled-representation A closed interval in one stated unit beside its citation, so the value and its provenance cannot be separated; `minimum <= maximum` is the producers' premise, checked where a band is written, by `ArchetypeBand.of`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four members: the interval, its unit for refusals, the citation and the provisional mark the sourcing rule (#3365 decision 4) requires.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default value member: the nominal value is the middle of the band, so it cannot disagree with it.
 */
export interface IArchetypeBand {
  /** The least value, in `unit`. */
  minimum: number;

  /** The greatest value, in `unit`; equal to `minimum` for a dimension a standard fixes. */
  maximum: number;

  /** The unit of both ends: `m`, `kg`, `degrees`, `N`, or empty for a ratio or a count. */
  unit: "m" | "kg" | "degrees" | "N" | "";

  /** Where the band comes from: the standard's clause or the measurement, with the address it was read at. */
  source: string;

  /** True when the band could not be read at its primary source, or is an estimate from a secondary one. */
  provisional?: boolean;
}
