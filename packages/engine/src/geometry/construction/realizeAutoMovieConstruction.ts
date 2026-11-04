import type { IAutoMovieConstruction } from "@automovie/interface";

import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";

/**
 * Realize a construction tree: loft every view part from its views, apply every join, continuation and trim in the tree's order (each host before what is built on it), and draw the body of trimmed faces as one skin that shares every boundary between its faces.
 *
 * A node whose premise breaks is left out with its diagnostic and its host stands as it was, so every admitted tree realizes. Admission runs before any work: a name used twice, a seed or face naming no view part or join of the right subtree, a width law inadmissible for its join, or a node outside the closed union refuses the whole call with the contract it broke.
 *
 * @evidence contracts/common.md#principled-implementation One recursive walk applies the operators the tree names, the tree's own containment ordering every host before the joins on it, and each operator is the kernel's (view loft, intersection trace, rails, blend, trim, body, zip), so the realization adds no geometry of its own.
 * @evidence contracts/common.md#clear-and-simple-design A tree and a chord tolerance in, one record out; the subtree rule lets any node be realized and checked alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A broken premise leaves its node out and names it; nothing is retried with relaxed tolerances or replaced by a primitive.
 * @evidence contracts/common.md#meaningful-documentation States the walk's order, the leave-out rule, the admission refusals and the result's units through its type.
 * @evidence contracts/performance.md#efficient-algorithms Each view part is lofted once and each join traced once; the skin is drawn once from the finished body.
 * @evidence contracts/performance.md#reuse-equivalent-work A face's surface is built once and shared by every join, trim and the skin that reads it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the records the result returns; the walk's scratch is released when the call returns.
 * @param construction The tree, metres and radians.
 * @param props The skin's chord tolerance.
 * @returns The realization.
 */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps,
): AutoMovieConstructionRealization.IRealization {
  throw new Error(`realizeAutoMovieConstruction: not implemented (${construction.name}, chord ${props.chord}).`);
}
