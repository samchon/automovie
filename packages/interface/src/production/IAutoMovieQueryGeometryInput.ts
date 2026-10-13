import { AutoMovieGeometryQuery } from "./AutoMovieGeometryQuery";

/**
 * Tool-compatible wrapper around the exact geometry-query union.
 *
 * The portable contract requires one non-union object parameter; the nested request
 * preserves discriminator validation without widening mutually exclusive fields
 * into optional properties.
 */
export interface IAutoMovieQueryGeometryInput {
  /**
   * Exact compact query over the current source compile. Selectors refer to
   * compiled node, formation or world identities, not caller-supplied
   * geometry.
   */
  request: AutoMovieGeometryQuery;
}
