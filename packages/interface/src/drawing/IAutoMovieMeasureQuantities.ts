import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";

/**
 * Data and callback contracts shared by the MeasureQuantities operations.
 *
 * @evidence contracts/development/design.md#principled-representation One environment snapshot and an optional positive-safe-integer contributor limit define arithmetic quantities in the source geometry's units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieQuantities reads the existing design; the bound controls reported owner names rather than the measured population.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent quantities are zero, unavailable quantities are gaps, and summed overlapping cell volumes remain explicitly approximate.
 * @evidence contracts/development/common.md#meaningful-documentation Documents contributor default, validation, exact/approximate distinctions and complete subject coverage.
 */
export namespace IAutoMovieMeasureQuantities {
  /**
   * Measure everything the design can answer for, and name everything it cannot.
   *
   * Throws an `Error` when `maxContributors` is not a positive safe integer or the design fails `validateBuiltEnvironment`. Every number is arithmetic over authored geometry: a support surface's plan footprint area with holes subtracted, attributed to its space; a space's volume as its shell's exact volume or the sum of its cells' volumes; an opening void's exact area with arcs; a connector route's polyline length; and counts of elements by kind, openings by kind and model occurrences by model. Nothing is looked up, defaulted or carried over from a previous revision.
   *
   * Every subject in {@link AUTOMOVIE_QUANTITY_SUBJECTS} gets one finding, so an absent quantity is a stated zero rather than a missing row. A finding names its largest owners up to the bound, counts and sums the rest, and says whether its total is exact; the space-volume total is approximate because overlapping cells are summed. What cannot be measured is a gap. The digest is SHA-256 over the canonical JSON of every other field.
   *
   * @evidence contracts/development/design.md#principled-representation One environment snapshot and an optional positive-safe-integer contributor limit define arithmetic quantities in the source geometry's units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieQuantities reads the existing design; the bound controls reported owner names rather than the measured population.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent quantities are zero, unavailable quantities are gaps, and summed overlapping cell volumes remain explicitly approximate.
   * @evidence contracts/development/common.md#meaningful-documentation Documents contributor default, validation, exact/approximate distinctions and complete subject coverage.
   */
  export type IProps = {
    /** Design the quantities are measured from. */
    environment: IAutoMovieBuiltEnvironment;

    /** Named-owner bound; defaults to the exported maximum. */
    maxContributors?: number;
  };
}
