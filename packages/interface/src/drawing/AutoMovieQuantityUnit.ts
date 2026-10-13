/**
 * Unit one measured quantity is expressed in: `m` (metres), `m2` (square
 * metres), `m3` (cubic metres) or `count` (dimensionless occurrences). Each
 * subject has one fixed unit, and a finding's total and contributors share it.
 *
 * @evidence contracts/common.md#principled-implementation SI units in ASCII spelling, assigned per subject by the `UNITS` table in `measureAutoMovieQuantities`, so a total and its contributors can never disagree on unit.
 * @evidence contracts/common.md#clear-and-simple-design Four literals cover lengths, areas, volumes and counts; no prefix or conversion is offered because every built environment measures in metres.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unit is looked up from the subject, never inferred from the value's magnitude or overridden per design.
 * @evidence contracts/common.md#meaningful-documentation Spells out each literal's meaning and that a subject's unit is fixed for every finding.
 * @author Samchon
 */
export type AutoMovieQuantityUnit = "m" | "m2" | "m3" | "count";
