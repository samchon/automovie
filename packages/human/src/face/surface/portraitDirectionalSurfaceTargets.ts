import { Vector3, measureAutoMovieMeshClearance } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { advancePoint } from "./advancePoint";
import { portraitDirectionalContactFrame } from "./portraitDirectionalContactFrame";
import { projectMeshOntoFrame } from "./projectMeshOntoFrame";

/**
 * Resolve complete triangle contact in the same frame as point contact. Each
 * offending face supplies its maximum required forward travel to all three
 * corners; a shared corner receives the maximum of its incident requirements.
 * Thus every interpolated point of that face advances at least its deficit.
 * The caller applies these metric targets through its shared skin adapter and
 * recomputes normals. This conservative construction preserves projected
 * topology; it does not decide anatomical thickness or fit quality.
 *
 * @evidence contracts/common.md#principled-implementation Each offending front triangle needs to advance along the direction by its clearance deficit for every interpolated point of it to clear the back surface, so all three corners take that requirement and a shared corner takes the maximum over its incident faces; advancing along one direction preserves the projected topology.
 * @evidence contracts/common.md#clear-and-simple-design Measure clearance in the directional frame, take per-vertex maxima, emit targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; the conservative construction is stated.
 * @evidence contracts/common.md#meaningful-documentation States that the caller applies the targets through its skin adapter and recomputes normals, and what is not decided.
 * @evidence contracts/modeling.md#spatial-conventions Engine metres in the frame of portraitDirectionalContactFrame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitDirectionalSurfaceTargets carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitDirectionalSurfaceTargets admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitDirectionalSurfaceTargets defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitDirectionalSurfaceTargets is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitDirectionalSurfaceTargets defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry portraitDirectionalSurfaceTargets emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries portraitDirectionalSurfaceTargets constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation portraitDirectionalSurfaceTargets owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function portraitDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const { forward, across, up } = portraitDirectionalContactFrame(
    direction,
    clearance,
  );
  const measured = measureAutoMovieMeshClearance(
    projectMeshOntoFrame(front, across, up, forward),
    projectMeshOntoFrame(back, across, up, forward),
    "z",
  );
  const indices =
    front.indices ??
    Array.from({ length: front.positions.length / 3 }, (_, i) => i);
  const travels = new Map<number, number>();
  for (const { triangle, minimum } of measured) {
    const distance = clearance - minimum;
    if (distance <= 0) continue;
    for (const vertex of indices.slice(triangle * 3, triangle * 3 + 3))
      travels.set(vertex, Math.max(travels.get(vertex) ?? 0, distance));
  }
  return [...travels].map(([vertex, distance]) => ({
    vertex,
    target: advancePoint(
      Vector3.create(
        front.positions[vertex * 3],
        front.positions[vertex * 3 + 1],
        front.positions[vertex * 3 + 2],
      ),
      forward,
      distance,
    ),
  }));
}
