import { measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { portraitNormals } from "../../mesh/portraitNormals";
import { portraitDirectionalSurfaceTargets } from "../../surface/portraitDirectionalSurfaceTargets";

/**
 * Fit two oral interiors behind the actual lip mesh in the head's +Z-forward
 * metre frame. All enamel vertices share one posterior translation, preserving
 * crown shape, inter-tooth arrangement and normals. The cavity then clears the
 * whole placed arch through shared triangle targets. Input buffers are owned by
 * the caller and remain unchanged. Clearance is a construction gap, not a
 * measurement of this subject's soft-tissue thickness.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps a rigid enamel arch behind the actual lip surface and clears its surrounding lining.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Computes one posterior crown-group translation, then uses complete-triangle directional targets to move cavity vertices and recompute their normals.
 */
export function fitPortraitOralContact(
  lips: IAutoMovieMesh,
  enamel: IAutoMovieMesh,
  cavity: IAutoMovieMesh,
  clearance: number,
): { enamel: IAutoMovieMesh; cavity: IAutoMovieMesh } {
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error("Oral clearance must be finite and nonnegative metres.");
  let retreat = 0;
  for (const { minimum } of measureAutoMovieMeshClearance(lips, enamel, "z"))
    retreat = Math.max(retreat, clearance - minimum);
  const placed = structuredClone(enamel);
  for (let i = 2; i < placed.positions.length; i += 3)
    placed.positions[i] -= retreat;
  const lining = structuredClone(cavity);
  for (const { vertex, target } of portraitDirectionalSurfaceTargets(
    lining,
    placed,
    { x: 0, y: 0, z: -1 },
    clearance,
  ))
    lining.positions.splice(vertex * 3, 3, target.x, target.y, target.z);
  lining.normals = portraitNormals(
    lining.positions,
    lining.indices ??
      Array.from({ length: lining.positions.length / 3 }, (_, i) => i),
  );
  return { enamel: placed, cavity: lining };
}
