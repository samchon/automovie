import { extrudeAutoMovieRegion } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { buildingModel } from "./buildingModel";

/** Extrude an admitted XZ plan encoded in XY into a closed, oriented slab model. */
export function buildingRegionModel(
  id: string,
  name: string,
  rings: readonly IAutoMovieProfilePoint[][],
  depth: number,
  color: string,
): IAutoMovieModel {
  return buildingModel(
    id,
    name,
    {
      type: "mesh",
      mesh: extrudeAutoMovieRegion({
        outer: rings[0]!,
        holes: rings.slice(1),
        depth,
      }),
    },
    color,
  );
}
