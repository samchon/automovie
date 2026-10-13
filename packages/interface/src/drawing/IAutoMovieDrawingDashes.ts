import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Dash pattern in page millimetres, per line role; an empty array is solid.
 *
 * Entries alternate dash and gap lengths as SVG `stroke-dasharray` does, and
 * `autoMovieDrawingToSvg` throws unless each one is finite and positive.
 *
 * @evidence contracts/common.md#principled-implementation The pattern is written verbatim to SVG `stroke-dasharray` in a sheet whose user unit is one page millimetre, so lengths keep their printed size at every drafting scale; an odd count repeats per the SVG rule.
 * @evidence contracts/common.md#clear-and-simple-design A mapped type over the closed role union forces exactly one pattern per role, so a style cannot forget a role or name one that does not exist.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero, negative or non-finite entry throws at serialization rather than being dropped or replaced with a default pattern.
 * @evidence contracts/common.md#meaningful-documentation States the page-millimetre unit, the solid meaning of an empty array, the alternation rule, and the serializer's refusal.
 * @author Samchon
 */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};
