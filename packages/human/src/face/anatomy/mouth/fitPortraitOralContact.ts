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
 *
 * @evidence contracts/common.md#principled-implementation The enamel is shifted rigidly posteriorly by the largest deficit of the measured clearance behind the lips, so its shape, inter-tooth arrangement and normals are preserved; the cavity is then pushed back behind the placed arch by shared triangle targets in the -Z direction. The premise is a clearance measured along Z between resident triangle meshes, which is the limit of the engine measurement, and the function refuses a negative or nonfinite clearance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and the caller's buffers are cloned, not patched.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame, that all enamel shares one translation, that the cavity clears the whole arch, that inputs are unchanged and that clearance is a construction gap and not a tissue thickness.
 * @evidence contracts/modeling.md#spatial-conventions Meshes are in the head's +Z-forward metre frame and the clearance is metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function fits two meshes and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The clearance between lips, enamel and cavity is one construction gap applied by this function to both relationships, so the two meet with the same gap; it is directional along Z and does not certify arbitrary collision freedom.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the clearance is a construction gap.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond a named clearance in metres.
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
