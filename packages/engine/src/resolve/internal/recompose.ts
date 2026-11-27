import { IAutoMovieTransform } from "@automovie/interface";

import { Matrix4 } from "../../math/Matrix4";
import { readLocal } from "./readLocal";
import { readWorld } from "./readWorld";

/*
 * Replace each descendant world matrix after its ancestor changes, using
 * borrowed admitted local transforms and acyclic child adjacency. Full matrix
 * products preserve composition shear; lookup failure can occur after earlier
 * descendants were updated.
 */
export function recompose(
  id: string,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void {
  const parentWorld: number[] = readWorld(world, id, "recompose parent");
  for (const child of childrenById.get(id) ?? []) {
    const t: IAutoMovieTransform = readLocal(localById, child);
    const local: number[] = Matrix4.compose(t.translation, t.rotation, t.scale);
    world.set(child, Matrix4.multiply(parentWorld, local));
    recompose(child, world, localById, childrenById);
  }
}
