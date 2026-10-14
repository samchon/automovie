import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { portraitDirectionalSurfaceTargets } from "../../surface/portraitDirectionalSurfaceTargets";
import { retreatPortraitEnamel } from "./retreatPortraitEnamel";

/**
 * Fit two oral interiors behind the actual lip mesh in the head's +Z-forward metre frame. All enamel vertices share one posterior translation, preserving crown shape, inter-tooth arrangement and normals. The cavity then clears the whole placed arch through shared triangle targets. Input buffers are owned by the caller and remain unchanged. Clearance is a construction gap, not a measurement of this subject's soft-tissue thickness.
 *
 * @evidence contracts/common.md#principled-implementation One rigid posterior enamel retreat precedes directional triangle-target fitting of the cloned cavity.
 * @evidence contracts/common.md#clear-and-simple-design Crown shape/inter-tooth arrangement remains separate from lining adjustment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Z-direction construction clearance does not prove arbitrary volume overlap or measured soft-tissue thickness.
 * @evidence contracts/common.md#meaningful-documentation All meshes are head-frame metres and fitted lining normals are recomputed from emitted topology.
 * @evidence contracts/performance.md#efficient-algorithms Triangle-pair directional measurement dominates retreat/fitting, followed by linear clone/normal work.
 * @evidence contracts/performance.md#reuse-equivalent-work Retreat and directional target owners are shared rather than distinct assembled geometry policies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned enamel and lining are owned copies and caller buffers remain unchanged.
 */
export function fitPortraitOralContact(
  lips: IAutoMovieMesh,
  enamel: IAutoMovieMesh,
  cavity: IAutoMovieMesh,
  clearance: number,
): { enamel: IAutoMovieMesh; cavity: IAutoMovieMesh } {
  const placed: IAutoMovieMesh = retreatPortraitEnamel(lips, enamel, clearance);
  const lining: IAutoMovieMesh = structuredClone(cavity);
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
      Array.from(
        { length: lining.positions.length / 3 },
        (_: unknown, i: number): number => i,
      ),
  );
  return { enamel: placed, cavity: lining };
}
