import { Vector3, minimizeAutoMovieMeshClearance } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

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
  const { forward, across, up } = portraitDirectionalContactFrame(direction, clearance);
  return minimizeAutoMovieMeshClearance(
    projectMeshOntoFrame(front, across, up, forward),
    projectMeshOntoFrame(back, across, up, forward),
    "z",
    clearance,
  ).map(({ vertex, distance }) => ({
    vertex,
    target: advancePoint(
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
