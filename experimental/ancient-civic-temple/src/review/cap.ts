import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { edgeInside } from "../geometry/edgeInside";
import { planeHeight } from "../geometry/planeHeight";
import type { RoofPatch } from "../geometry/RoofPatch";
import { ceiling } from "./ceiling";


export const cap = (space: IAutoMovieBuiltSpace, x: number, z: number, roof: readonly RoofPatch[]): { physical: number; volume: number; } | null => {
  const volume = ceiling(space, x, z);
  if (volume === null) return null;
  const tier = space.id === "sanctuary" ? "sanctuary"
    : ["service-yard", "courtyard", "entrance"].includes(space.id) ? null : "wing";
  if (tier === null) return { physical: volume, volume };
  const top = roof.filter((patch) => patch.tier === tier && patch.polygon.every((vertex, i) => planeHeight(edgeInside(vertex, patch.polygon[(i + 1) % patch.polygon.length]!), { x, z }) >= -1e-8))
    .map((patch) => planeHeight(patch.height, { x, z }));
  return { physical: top.length === 0 ? volume : Math.max(...top), volume };
};
