import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Stroke width in page millimetres, per line role.
 *
 * Every role needs a width, and `autoMovieDrawingToSvg` throws when one is not
 * a finite positive number.
 *
 * @evidence contracts/common.md#principled-implementation A mapped type over `AutoMovieDrawingRole`, so the compiler demands exactly one width each for cut, projected, overhead and hidden lines, and a role added to the union cannot ship without a weight.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors `IAutoMovieDrawingDashes` key for key, so the serializer looks up a line's width and dash pattern by the same `line.role` with no lookup table or default.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no fallback width: the serializer refuses a non-finite or non-positive entry with an error naming the view and role instead of substituting a value.
 * @evidence contracts/common.md#meaningful-documentation States the page-millimetre unit, that every role is required, and the positivity rule with the function that enforces it.
 * @author Samchon
 */
export type IAutoMovieDrawingWeights = {
  [role in AutoMovieDrawingRole]: number;
};
