import {
  type IAutoMovieGroundQueryPoint,
  type IAutoMovieReadGeometryGround,
  IAutoMovieWorldDesign,
  type IAutoMovieWorldSurface,
} from "@automovie/interface";

import { readSurfaceHeight } from "../space/world/internal/readSurfaceHeight";
import { selectGroundSurface } from "../space/world/internal/selectGroundSurface";

/*
 * Read the first containing world surface at an XZ point in metres; no surface
 * returns height zero, null surface and walkable=false.
 */
export const readGeometryGround: (
  world: Pick<IAutoMovieWorldDesign, "surfaces"> | null,
  point: IAutoMovieGroundQueryPoint,
) => IAutoMovieReadGeometryGround.IResult = (
  world: Pick<IAutoMovieWorldDesign, "surfaces"> | null,
  point: IAutoMovieGroundQueryPoint,
): IAutoMovieReadGeometryGround.IResult => {
  const surface: IAutoMovieWorldSurface | null = selectGroundSurface(
    world?.surfaces ?? [],
    point,
  );
  return surface === null
    ? { height: 0, surface: null, walkable: false }
    : {
        height: readSurfaceHeight(surface, point),
        surface: surface.id,
        walkable: surface.walkable,
      };
};
