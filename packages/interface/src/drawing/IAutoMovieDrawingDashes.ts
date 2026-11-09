import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Dash pattern in page millimetres, per line role; an empty array is solid.
 *
 * Entries alternate dash and gap lengths as SVG `stroke-dasharray` does, and
 * `autoMovieDrawingToSvg` throws unless each one is finite and positive.
 *
 * @evidence contracts/development/design.md#principled-representation Entries are formatted to three decimal places as SVG stroke-dasharray in page millimetres; empty arrays omit the attribute and odd patterns follow SVG repetition. Finite-positive admission precedes rounding, so tiny entries can print zero and extreme finite entries can overflow the formatting intermediate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mapped type requires an array for every known role. It exposes missing members to TypeScript without providing runtime exact-key admission, and the serializer reads the fixed role list rather than arbitrary extra keys.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero, negative or non-finite entry throws at serialization rather than being dropped or replaced with a default pattern.
 * @evidence contracts/development/common.md#meaningful-documentation States the page-millimetre unit, the solid meaning of an empty array, the alternation rule, and the serializer's refusal.
 */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};
