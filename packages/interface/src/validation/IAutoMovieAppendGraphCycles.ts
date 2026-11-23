/** Ordered graph projection consumed by the common directed-cycle reporter. */
export namespace IAutoMovieAppendGraphCycles {
  /**
   * Borrowed graph nodes visited by iterative depth-first traversal in
   * declaration/link order. appendGraphCycles appends one type finding for each
   * edge to a currently visiting id at the target node's path, retaining its
   * value. Nodes and links are not mutated.
   *
   * Unknown links are skipped because reference admission belongs to the
   * caller. Ids match exactly. With duplicate ids, link lookup uses the last
   * declaration but outer traversal can start the first declaration; visited
   * state is keyed by id, so uniqueness must be checked separately. Collector
   * exceptions propagate and earlier findings remain appended.
   */
  export type INodes = readonly {
    /** Exact identity used for visited-state and outgoing reference lookup. */
    id: string;

    /**
     * Ordered outgoing target ids; empty means no edges and missing targets are
     * skipped.
     */
    links: readonly string[];

    /**
     * Finding path used when this node is the target of a back edge, rather
     * than the source edge's location.
     */
    path: string;

    /**
     * Unchecked offending payload passed by reference to the collector and
     * potentially retained by its findings.
     */
    value: unknown;
  }[];
}
