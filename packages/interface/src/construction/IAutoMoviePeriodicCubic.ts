/**
 * The existing periodic cubic's value reader and a local outward range.
 * Preparation and reading retain the original 64 Jacobi sweeps and literal
 * expression. Range conversion encloses that computed reader, not an exact
 * solution of the infinite-precision cyclic equations or tight extrema.
 */
export namespace IAutoMoviePeriodicCubic {
  /** One preparation shared by value reads and optional range admission. */
  export interface IPrepared {
    /** Existing periodic value at a phase in radians; controls remain unchanged. */
    at(psi: number): number;

    /**
     * Finite outward bounds for every finite phase; throws when arithmetic
     * cannot certify them.
     */
    range(): readonly [number, number];
  }
}
