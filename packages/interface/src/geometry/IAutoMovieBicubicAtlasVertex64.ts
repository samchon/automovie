import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Mutable allocation cursor and analytic patch-jet callback used by atlas
 * vertices.
 */
export namespace IAutoMovieBicubicAtlasVertex64 {
  /**
   * Global append cursor shared by all patch vertex owners in one generator
   * run.
   */
  export type ICursor = {
    /**
     * Next unused global render index, including vertexOffset; incremented only
     * after a new vertex position is admitted. Preserve this object across
     * chunk changes.
     */
    nextIndex: number;
  };

  /**
   * Synchronous analytic query of an admitted prepared root patch. p is its
   * zero-based input ordinal and u,v are dimensionless unit-square coordinates.
   * The emitter's implementation captures prepared plans and allocates fresh
   * position/normal tuples; callers must preserve plans throughout use. Errors
   * propagate to patch emission, which records local unprocessed work.
   */
  export type IJet = (
    p: number,
    u: number,
    v: number,
  ) => {
    /**
     * Analytic root-grid position in model millimetres, before the vertex owner
     * converts to metres or substitutes a canonical shared position.
     */
    position: AutoMovieVector3Tuple;

    /**
     * Unit du cross dv in model coordinates when regular, otherwise [0,0,0];
     * not an outward-orientation certificate.
     */
    normal: AutoMovieVector3Tuple;

    /**
     * Whether the evaluated analytic normal has finite positive length. This
     * flag does not independently validate position finiteness or global
     * immersion.
     */
    regular: boolean;
  };
}
