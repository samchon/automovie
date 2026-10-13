import { IAutoMovieTransform } from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { readLocal } from "./readLocal";
import { readWorld } from "./readWorld";

/** Recompute every descendant's world matrix from a node's updated world. */
export const recompose = (
  id: string,
  world: Map<string, number[]>,
  localById: Map<string, IAutoMovieTransform>,
  childrenById: Map<string, string[]>,
): void => {
  const parentWorld = readWorld(world, id, "recompose parent");
  for (const child of childrenById.get(id) ?? []) {
    const t = readLocal(localById, child);
    const local = Matrix4.compose(t.translation, t.rotation, t.scale);
    world.set(child, Matrix4.multiply(parentWorld, local));
    recompose(child, world, localById, childrenById);
  }
};
