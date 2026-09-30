import { Vector3 } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A copy of a mesh with its positions expressed in a directional frame: each
 * position becomes its dot products with `across`, `up` and `forward`. The
 * copy sets `normals` to null. Refuses positions that are incomplete or not
 * finite. Shared by the directional contact and
 * intersection constructors.
 *
 * @author Samchon
 */
export function projectMeshOntoFrame(
  mesh: IAutoMovieMesh,
  across: IAutoMovieVector3,
  up: IAutoMovieVector3,
  forward: IAutoMovieVector3,
): IAutoMovieMesh {
  if (mesh.positions.length % 3 !== 0 || !mesh.positions.every(Number.isFinite))
    throw new Error(
      "Directional contact needs complete finite mesh positions.",
    );
  const positions: number[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const point = Vector3.create(
      mesh.positions[i],
      mesh.positions[i + 1],
      mesh.positions[i + 2],
    );
    positions.push(
      Vector3.dot(point, across),
      Vector3.dot(point, up),
      Vector3.dot(point, forward),
    );
  }
  return { ...mesh, positions, normals: null };
}
