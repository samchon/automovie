import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * Every role needs a width, and `autoMovieDrawingToSvg` throws when one is not
 * a finite positive number. The `cut` width also strokes opening outlines and
 * the `projected` width strokes dimension lines.
 *
 * @evidence contracts/common.md#principled-implementation The serializer writes the role's width verbatim as SVG `stroke-width` in a sheet whose user unit is one page millimetre, so a stroke keeps its printed thickness whatever the drafting scale.
 * @evidence contracts/common.md#clear-and-simple-design A mapped type over the closed role union requires exactly one width per role, so adding a role forces every style to state its pen.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero, negative or non-finite width throws at serialization rather than falling back to a hairline or a default weight.
 * @evidence contracts/common.md#meaningful-documentation States the page-millimetre unit, that every role is required, the serializer's refusal, and which roles' widths also stroke openings and dimensions.
 * @author Samchon
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
