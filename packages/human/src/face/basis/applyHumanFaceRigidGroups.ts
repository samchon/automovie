import { Quaternion } from "@automovie/engine/math/Quaternion";
import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Replace each declared component's performance with one shape-preserving pose.
 * The builder owns positions; reference contains the same shape without any
 * expression. Membership is admitted by assertHumanFaceRigidGroups and both
 * arrays retain source vertex correspondence. Fitted components minimize squared
 * target error with a proper rotation and centroid translation. Fixed components
 * retain reference positions. Only positions is mutated, before common normals
 * and UV-region separation; attachments and export therefore see the same pose.
 * Exact unchanged groups bypass fitting to retain neutral replay bit for bit.
 * This geometric constraint does not establish joint limits or contact validity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Performs rigid facial components without deforming their authored identity.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Applies fixed or proper rigid motion before shared normals and region separation.
 */
export function applyHumanFaceRigidGroups(
  groups: NonNullable<
    IAutoMovieHumanFaceBasis["surfaces"][number]["rigidGroups"]
  >,
  reference: number[],
  positions: number[],
): void {
  for (const group of groups) {
    if (group.motion === "fixed") {
      for (const vertex of group.vertices)
        for (let k = 0; k < 3; k++)
          positions[3 * vertex + k] = reference[3 * vertex + k];
      continue;
    }
    if (
      group.vertices.every((v) =>
        [0, 1, 2].every((k) => positions[3 * v + k] === reference[3 * v + k]),
      )
    )
      continue;
    const {
      rotation,
      referenceCenter: a,
      targetCenter: b,
    } = fitRigidMeshTransform({
      reference,
      target: positions,
      vertices: group.vertices,
    });
    for (const v of group.vertices) {
      const rotated = Quaternion.rotateVector(rotation, {
        x: reference[3 * v] - a.x,
        y: reference[3 * v + 1] - a.y,
        z: reference[3 * v + 2] - a.z,
      });
      positions[3 * v] = rotated.x + b.x;
      positions[3 * v + 1] = rotated.y + b.y;
      positions[3 * v + 2] = rotated.z + b.z;
    }
  }
}
