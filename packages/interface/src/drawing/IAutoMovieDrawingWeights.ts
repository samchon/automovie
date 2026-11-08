import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * Every role needs a width, and `autoMovieDrawingToSvg` throws when one is not
 * a finite positive number. The `cut` width also strokes opening outlines and
 * the `projected` width strokes dimension lines.
 *
 * @evidence contracts/development/design.md#principled-representation The serializer formats role width to three decimal places as SVG stroke-width in page millimetres, independently of model scale. The finite-positive gate applies before formatting: sub-grid widths can print zero and multiplication by 1000 can overflow for extreme finite inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mapped type requires one numeric width for every role, so adding a role exposes missing members to TypeScript. Structural assignability is not runtime rejection of extra properties; the serializer reads only the known role keys.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero, negative or non-finite width throws at serialization rather than falling back to a hairline or a default weight.
 * @evidence contracts/development/common.md#meaningful-documentation States the page-millimetre unit, that every role is required, the serializer's refusal, and which roles' widths also stroke openings and dimensions.
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
