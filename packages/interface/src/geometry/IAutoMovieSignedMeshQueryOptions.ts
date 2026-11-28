/**
 * Topology admission for a compiled oriented-distance query.
 *
 * Both modes require connected vertex fans and opposing directions on paired
 * edges. Each edge has at most two triangle uses. In open mode, one-use edges
 * belong to the rim and receive a boundary flag when they support a hit.
 * Outward orientation and a surface free of self-crossings remain caller
 * premises for closed-volume interpretation. Unknown boundary modes throw
 * before topology compilation.
 */
export interface IAutoMovieSignedMeshQueryOptions {
  /**
   * `closed`, the default when omitted, requires every edge to be paired with
   * an oppositely wound twin; `open` also admits single-use rim edges.
   */
  boundary?: "closed" | "open";
}
