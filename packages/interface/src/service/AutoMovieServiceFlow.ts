/**
 * Direction in which network reachability is traversed from a declared system root.
 *
 * @evidence contracts/common.md#principled-implementation serviceSystemReach walks forward adjacency for from-root, backward for to-root and both for undirected; load reads the demand-bearing end appropriate to that direction.
 * @evidence contracts/common.md#clear-and-simple-design Three graph traversal choices express supply, return and ring topology without implying a physical flow solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root orientation is explicit and not inferred from discipline or port order; declaration reachability is distinct from closed-valve operating reach.
 * @evidence contracts/common.md#meaningful-documentation Defines forward, reverse and bidirectional root traversal semantics.
 */
export type AutoMovieServiceFlow = "from-root" | "to-root" | "undirected";
