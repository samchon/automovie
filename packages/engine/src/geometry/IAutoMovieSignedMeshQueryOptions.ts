/**
 * Topology admission for a compiled oriented-distance query.
 *
 * An open sheet retains oriented interior features while reporting rim-feature
 * side as unknown. Both modes refuse an edge used by three or more triangles,
 * a paired edge whose two uses run the same direction, and a vertex whose
 * incident faces form disconnected fans; neither mode infers outward
 * orientation or absence of self-crossing.
 *
 * @evidence contracts/development/design.md#principled-representation `createAutoMovieSignedMeshQuery` counts each exactly welded edge's uses and direction balance and walks every vertex link, so the pseudonormal sign is computed only where the surface is an oriented 2-manifold, with or without a rim depending on this choice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional two-value field because the only real difference between a closed shell and an oriented sheet is whether single-use edges are admitted; every other admission rule is shared.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Open mode does not close a rim or guess its outside; it admits the rim and has every reading near it report `boundary: true` so the caller decides how far a side is trustworthy.
 * @evidence contracts/development/common.md#meaningful-documentation States what each mode admits, every refusal common to both, what open mode reports at the rim, and what neither mode checks.
 */
export interface IAutoMovieSignedMeshQueryOptions {
  /**
   * `closed`, the default when omitted, requires every edge to be paired with
   * an oppositely wound twin; `open` also admits single-use rim edges.
   */
  boundary?: "closed" | "open";
}
