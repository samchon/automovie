
/**
 * Call-local reader of one original scalar outline at physical station in millimetres. The containing field defines value units. It reuses its admitted preparation; an outline read refusal reports its original source name and returns NaN, while thrown getter exceptions propagate.
 *
 * @evidence contracts/development/design.md#principled-representation A station-to-value callback preserves the original outline and selected pole parameter without claiming physical derivative availability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewLoft uses the same scalar capability for signed extents, girth and shoulder ownership while their fields state distinct units.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Read failure is exposed as reported NaN rather than a substitute extent or shoulder.
 * @evidence contracts/development/common.md#meaningful-documentation States station units, field-owned result units, preparation reuse and failure signaling.
 */
export type AutoMovieViewLoftInputsScalar = (station: number) => number;
