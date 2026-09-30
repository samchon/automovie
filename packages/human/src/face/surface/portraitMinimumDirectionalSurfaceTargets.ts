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
 * @evidence contracts/common.md#principled-implementation The engine's joint minimisation keeps every original overlap condition while bounding how far any vertex advances, so the travel is the least that clears all triangles in the directional frame; the targets are advanced along the same fixed direction.
 * @evidence contracts/common.md#clear-and-simple-design It frames, delegates to the engine's minimiser and maps distances to targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States the shared frame and that skin propagation, seams and normals belong to the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Engine metres in the shared directional frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitMinimumDirectionalSurfaceTargets carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitMinimumDirectionalSurfaceTargets admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitMinimumDirectionalSurfaceTargets defines no input through which a caller shapes a human form.
 */
export function portraitMinimumDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const { forward, across, up } = portraitDirectionalContactFrame(
    direction,
    clearance,
  );
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
