import { AutoMovieDrawingRole } from "./AutoMovieDrawingRole";

/**
 * Dash pattern in page millimetres, per line role; an empty array is solid.
 *
 * Entries alternate dash and gap lengths as SVG `stroke-dasharray` does, and
 * `autoMovieDrawingToSvg` throws unless each one is finite and positive.
 *
 * @evidence contracts/common.md#principled-implementation A mapped type over `AutoMovieDrawingRole`, so every role must state a pattern, which the serializer formats to three decimals and writes as `stroke-dasharray` in page millimetres, omitting the attribute for an empty array.
 * @evidence contracts/common.md#clear-and-simple-design A plain number array per role reuses SVG's own dash convention instead of a vocabulary of named patterns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite or non-positive entries throw at serialization instead of being clamped or dropped, and the empty array is the one special value, meaning a solid stroke.
 * @evidence contracts/common.md#meaningful-documentation States the paper unit, the alternating dash and gap meaning, the empty-array rule, and the check the serializer applies.
 * @author Samchon
 */
export type IAutoMovieDrawingDashes = {
  [role in AutoMovieDrawingRole]: number[];
};
