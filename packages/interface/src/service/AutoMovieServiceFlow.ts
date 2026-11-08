/**
 * Direction in which network reachability is traversed from a declared system root.
 *
 * @evidence contracts/development/design.md#principled-representation serviceSystemReach walks forward adjacency for from-root, backward for to-root and both for undirected; load reads the demand-bearing end appropriate to that direction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three graph traversal choices express supply, return and ring topology without implying a physical flow solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Root orientation is explicit and not inferred from discipline or port order; declaration reachability is distinct from closed-valve operating reach.
 * @evidence contracts/development/common.md#meaningful-documentation Defines forward, reverse and bidirectional root traversal semantics.
 */
export type AutoMovieServiceFlow = "from-root" | "to-root" | "undirected";
