import {
  type IAutoMovieGroundQueryPoint,
  type IAutoMovieReadGeometryGround,
  IAutoMovieWorldDesign,
  type IAutoMovieWorldSurface,
} from "@automovie/interface";

import { worldGroundSurface } from "./worldGroundSurface";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/**
 * Read the first containing world surface at an XZ point in metres; no surface
 * returns height zero, null surface and walkable=false.
 */
export const readAutoMovieGeometryGround: (
  world: Pick<IAutoMovieWorldDesign, "surfaces"> | null,
  point: IAutoMovieGroundQueryPoint,
) => IAutoMovieReadGeometryGround.IResult = (
  world: Pick<IAutoMovieWorldDesign, "surfaces"> | null,
  point: IAutoMovieGroundQueryPoint,
): IAutoMovieReadGeometryGround.IResult => {
  const surface: IAutoMovieWorldSurface | null = worldGroundSurface(
    world?.surfaces ?? [],
    point,
  );
  return surface === null
    ? { height: 0, surface: null, walkable: false }
    : {
        height: worldSurfaceHeight(surface, point),
        surface: surface.id,
        walkable: surface.walkable,
      };
};
