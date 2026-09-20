import { Vector3, minimizeAutoMovieMeshClearance } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Minimize complete-triangle contact travel in the same frame used by the
 * resident intersection and conservative contact queries. Every original
 * overlap condition survives the engine's joint solve, while incident face
 * deficits bound how far any vertex may advance. The consumer owns subsequent
 * skin propagation, seam correspondence, normals and exported contact checks.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Supplies shared-skin contact targets with minimum area-weighted motion inside the existing conservative displacement envelope.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Projects the resident meshes through the common directional frame and carries the engine's joint vertex displacements back to metric attachment targets.
 */
export function portraitMinimumDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const { forward, across, up } = contactFrame(direction, clearance);
  return minimizeAutoMovieMeshClearance(
    project(front, across, up, forward),
    project(back, across, up, forward),
    "z",
    clearance,
  ).map(({ vertex, distance }) => ({
    vertex,
    target: advance(
      Vector3.create(
        ...(front.positions.slice(3 * vertex, 3 * vertex + 3) as [
          number,
          number,
          number,
        ]),
      ),
      forward,
      distance,
    ),
  }));
}

function contactFrame(direction: IAutoMovieVector3, clearance: number) {
  if (
    ![direction.x, direction.y, direction.z, clearance].every(
      Number.isFinite,
    ) ||
    clearance < 0 ||
    Vector3.length(direction) === 0
  )
    throw new Error(
      "Directional contact needs a finite nonzero direction and nonnegative clearance.",
    );
  const forward = Vector3.normalize(direction);
  const guide =
    Math.abs(forward.y) < 0.9
      ? Vector3.create(0, 1, 0)
      : Vector3.create(1, 0, 0);
  const across = Vector3.normalize(Vector3.cross(guide, forward));
  const up = Vector3.cross(forward, across);
  return { forward, across, up };
}

function project(
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

function advance(
  point: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  distance: number,
): IAutoMovieVector3 {
  const result = Vector3.add(point, Vector3.scale(forward, distance));
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error(
      "Directional contact exceeds its finite coordinate domain.",
    );
  return result;
}
