import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";

/** Callable source preparation for repeated clipped region queries. */

export namespace IAutoMovieRecoveryEventRegionSource {
  /**
   * Prepare source rank and original incidence once. Keep the source arrays
   * unchanged during later queries. Return physical rank, duplicate and
   * collapsed face witnesses, edge-use counts and selected address helpers.
   */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
  ) => {
    /** Original vertex population size. */
    size: number;

    /** Original physical rank per source face, encoded as zero, one or two. */
    ranks: Uint8Array;

    /** Original triangle ordinals that repeat a declared face incidence. */
    duplicate: Set<number>;

    /**
     * Original triangle ordinals with fewer than three distinct declared
     * corners.
     */
    collapsed: Set<number>;

    /** Declared original edge incidence key to original face-use count. */
    sourceEdges: Map<string, number>;

    /** Maps original vertices into the selected raw or canonical address space. */
    address: (vertex: number) => number;

    /** Forms a deterministic unordered vertex pair key. */
    pair: (a: number, b: number) => string;
  };
}
