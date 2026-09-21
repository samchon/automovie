import { advance } from "./advance";
import { contactFrame } from "./contactFrame";
import { project } from "./project";
import { Vector3, measureAutoMovieMeshClearance } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Resolve complete triangle contact in the same frame as point contact. Each
 * offending face supplies its maximum required forward travel to all three
 * corners; a shared corner receives the maximum of its incident requirements.
 * Thus every interpolated point of that face advances at least its deficit.
 * The caller applies these metric targets through its shared skin adapter and
 * recomputes normals. This conservative construction preserves projected
 * topology; it does not decide anatomical thickness or fit quality.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Supplies shared-skin vertex targets that clear complete contacting triangles, not just sampled corners.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Measures front/back triangle clearance in a common directional frame and applies the maximum incident travel to each affected vertex.
 */
export function portraitDirectionalSurfaceTargets(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  direction: IAutoMovieVector3,
  clearance = 0,
): { vertex: number; target: IAutoMovieVector3 }[] {
  const { forward, across, up } = contactFrame(direction, clearance);
  const measured = measureAutoMovieMeshClearance(
    project(front, across, up, forward),
    project(back, across, up, forward),
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
    target: advance(
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
