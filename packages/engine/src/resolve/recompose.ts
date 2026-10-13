import { IAutoMovieTransform } from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { readLocal } from "./readLocal";
import { readWorld } from "./readWorld";

/**
 * Replace each descendant world matrix after its ancestor changes, using borrowed admitted local transforms and acyclic child adjacency. Full matrix products preserve composition shear; lookup failure can occur after earlier descendants were updated.
 *
 * @evidence contracts/common.md#principled-implementation Walk supplied descendants, compose their admitted local TRS and multiply updated parent matrices recursively, preserving full-matrix composition shear.
 * @evidence contracts/common.md#clear-and-simple-design Child indexing and required-map readers separate graph/lookup admission from this world-map mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing local state throws; stale/cyclic adjacency and deep recursion remain caller/stack limitations rather than silently repaired topology.
 * @evidence contracts/common.md#meaningful-documentation Docs state descendant-only mutation and borrowed local/topology maps; later failure may leave earlier descendants updated.
 * @evidence contracts/performance.md#efficient-algorithms S descendants require O(S) fixed-size matrix work/replacements and O(H) recursion stack for depth H.
 * @evidence contracts/performance.md#reuse-equivalent-work One frame's local/child maps serve all drivers; changed ancestors invalidate descendant matrices and require recomposition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns replacements/maps and temporary locals/stack release on return or failure, with no host graph handle or worker.
 */
export const recompose: (id: string, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>) => void = (
  id: string,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  const parentWorld: number[] = readWorld(world, id, "recompose parent");
  for (const child of childrenById.get(id) ?? []) {
    const t: IAutoMovieTransform = readLocal(localById, child);
    const local: number[] = Matrix4.compose(t.translation, t.rotation, t.scale);
    world.set(child, Matrix4.multiply(parentWorld, local));
    recompose(child, world, localById, childrenById);
  }
};
