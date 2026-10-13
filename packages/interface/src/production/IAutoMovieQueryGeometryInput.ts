import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";

/**
 * Tool-compatible wrapper around the exact geometry-query union.
 *
 * The portable tool contract takes one non-union object parameter; its nested request preserves the exact query discriminator and mutually exclusive operands.
 *
 * @evidence contracts/common.md#principled-implementation An object wrapper carries the closed AutoMovieGeometryQuery union through the production oracle tool seam, where current compiled artifacts rather than caller-supplied geometry provide measurement authority.
 * @evidence contracts/common.md#clear-and-simple-design One request property satisfies the tool parameter shape while retaining the existing discriminated query representation instead of flattening incompatible optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A compact query cannot inject a scene graph or stale measurement result; missing or stale compilation and unresolved selectors are refused by the oracle.
 * @evidence contracts/common.md#meaningful-documentation Defines the tool-wrapper reason, exact nested query and compiled identity ownership of selectors.
 * @author Samchon
 */
export interface IAutoMovieQueryGeometryInput {
  /**
   * Exact compact query over the current source compile. Selectors refer to compiled node, formation or world identities, not caller-supplied geometry.
   */
  request: AutoMovieGeometryQuery;
}
