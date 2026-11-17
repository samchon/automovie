/**
 * Three complete coefficient functions, not frozen Cartesian point jets.
 *
 * @evidence contracts/development/design.md#principled-representation Three rows hold complete basis coefficients and their first and second physical-station derivatives, in mm, mm/mm and 1/mm; row lengths and finiteness are checked by LoftSectionLegacy.extend.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface tuple serves the engine's coefficient-polynomial boundary extension; the existing basis owns coefficient ordering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exactly three rows are required structurally; equal lengths and a supported basis order remain runtime premises, and no Cartesian Taylor fit is implied.
 * @evidence contracts/development/common.md#meaningful-documentation States coefficient-row order, physical units and extension admission.
 */
export type AutoMovieLoftSectionLegacyRows = readonly [
  readonly number[],
  readonly number[],
  readonly number[],
];
