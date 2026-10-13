/**
 * Topology admission for a compiled oriented-distance query.
 *
 * An open sheet retains oriented interior features while reporting rim-feature
 * side as unknown. Both modes refuse multiply incident or inconsistently wound
 * edges; neither mode infers outward orientation or absence of self-crossing.
 *
 * @author Samchon
 */
export interface IAutoMovieSignedMeshQueryOptions {
  /** Omitted requires paired opposite edges; open admits single-incident rims. */
  boundary?: "closed" | "open";
}
