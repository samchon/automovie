import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { portraitDirectionalSurfaceTargets } from "../../surface/portraitDirectionalSurfaceTargets";
import { retreatPortraitEnamel } from "./retreatPortraitEnamel";

/**
 * Fit two oral interiors behind the actual lip mesh in the head's +Z-forward
 * metre frame. All enamel vertices share one posterior translation, preserving
 * crown shape, inter-tooth arrangement and normals. The cavity then clears the
 * whole placed arch through shared triangle targets. Input buffers are owned by
 * the caller and remain unchanged. Clearance is a construction gap, not a
 * measurement of this subject's soft-tissue thickness.
 */
export function fitPortraitOralContact(
  lips: IAutoMovieMesh,
  enamel: IAutoMovieMesh,
  cavity: IAutoMovieMesh,
  clearance: number,
): { enamel: IAutoMovieMesh; cavity: IAutoMovieMesh } {
  const placed = retreatPortraitEnamel(lips, enamel, clearance);
  const lining = structuredClone(cavity);
  for (const { vertex, target } of portraitDirectionalSurfaceTargets(
    lining,
    placed,
    { x: 0, y: 0, z: -1 },
    clearance,
  ))
    lining.positions.splice(vertex * 3, 3, target.x, target.y, target.z);
  lining.normals = areaWeightedNormals(
    lining.positions,
    lining.indices ??
      Array.from({ length: lining.positions.length / 3 }, (_, i) => i),
  );
  return { enamel: placed, cavity: lining };
}
