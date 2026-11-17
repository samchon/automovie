/**
 * A named instant of a cue track or of a placed entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a named absolute film instant, permitting repeated names in source order.
 * @evidence contracts/development/design.md#principled-representation seconds shares composition origin zero and is not an action-relative offset; the supplying law owns finite values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed cue tracks, dynamic instants and placed-entry events use this shape for schedule anchor lookup.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Repeated names remain separate occurrences selected by index rather than being lost in a name-keyed map.
 */
export interface IAutoMovieScheduleCue {
  /** The instant's name; a track may repeat one, as a score repeats `beat`. */
  name: string;

  /** Absolute film seconds, not an offset from the current intent. Numeric validity is the law's responsibility. */
  seconds: number;
}
