/**
 * Topology admission for a compiled oriented-distance query.
 *
 * An open sheet retains oriented interior features while reporting rim-feature
 * side as unknown. Both modes refuse an edge used by three or more triangles, a
 * paired edge whose two uses run the same direction, and a vertex whose
 * incident faces form disconnected fans; neither mode infers outward
 * orientation or absence of self-crossing.
 */
export interface IAutoMovieSignedMeshQueryOptions {
  /**
   * `closed`, the default when omitted, requires every edge to be paired with
   * an oppositely wound twin; `open` also admits single-use rim edges.
   */
  boundary?: "closed" | "open";
}
