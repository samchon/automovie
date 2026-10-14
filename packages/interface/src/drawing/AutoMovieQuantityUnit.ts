/**
 * Unit one measured quantity is expressed in: `m` (metres), `m2` (square
 * metres), `m3` (cubic metres) or `count` (dimensionless occurrences). Each
 * subject has one fixed unit, and a finding's total, contributors and omitted
 * value share it.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` maps each subject to its unit through an exhaustive record typed over `AutoMovieQuantitySubject`, so a new subject cannot compile without a unit, and all lengths are model metres with no conversion.
 * @evidence contracts/common.md#clear-and-simple-design Four SI-style literals cover lengths, areas, volumes and counts; the unit is written on the finding so a reader of one row needs no lookup table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No scale or display unit is applied per consumer; every finding is reported in the model's own metres.
 * @evidence contracts/common.md#meaningful-documentation States what each literal means and that one finding's numbers all share its unit.
 * @author Samchon
 */
export type AutoMovieQuantityUnit = "m" | "m2" | "m3" | "count";
