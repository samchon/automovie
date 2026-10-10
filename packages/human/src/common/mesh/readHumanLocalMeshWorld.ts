import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

/**
 * Reconstruct the actual local Float32 publication in its source metre frame.
 * This CPU view is measurement data, not an additional rendered surface.
 */
export function readHumanLocalMeshWorld(
  mesh: IAutoMovieMesh,
  transform?: IAutoMovieTransform | null,
): IAutoMovieMesh {
  const rounded: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map(Math.fround),
    normals: mesh.normals?.map(Math.fround) ?? null,
  };
  return transform === undefined || transform === null
    ? rounded
    : transformAutoMovieMesh(rounded, transform);
}
