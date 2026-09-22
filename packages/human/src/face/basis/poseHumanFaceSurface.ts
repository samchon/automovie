import { Quaternion, Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

type Attachments = NonNullable<
  IAutoMovieHumanFaceBasis["surfaces"][number]["attachments"]
>;

/**
 * Linear blend skinning of one rest surface through its sparse attachments.
 *
 * For a vertex p with owner weights w_o, the posed position is
 * `p + sum(w_o * (M_o(p) - p))`, which equals `(1 - sum w_o) p + sum w_o M_o(p)`:
 * the cranium keeps the complement, a vertex bound with weight one moves
 * rigidly with its owner (a tooth on the arc, not the chord), and a blended
 * vertex takes the weighted mean of its owners' rigid images, which is the
 * lag the residual expression rows were measured against. An owner the
 * attachments name without a motion is a programming error and throws; the
 * basis admission guarantees attachments name only declared owners.
 *
 * `unposeHumanFaceSurface` is the exact inverse, used by offline preparation
 * to carry a source pose into rest space.
 *
 * Normals are not transported here: the builder recomputes them on the posed
 * surface. Inputs are never mutated; results are fresh buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Moves teeth, tongue, lining and lip tissue with the same mandibular transform, and the globes with their own, before tissue detail is read.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Implements the weighted sum of rigid images over sparse attachments and its exact per-vertex inverse.
 */
export function poseHumanFaceSurface(
  positions: readonly number[],
  attachments: Attachments,
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): number[] {
  const output = positions.slice();
  for (const attachment of attachments) {
    const motion = motions.get(attachment.owner);
    if (motion === undefined)
      throw new Error(
        "Facial attachment names an owner without motion: " + attachment.owner,
      );
    const rows = attachment.rows;
    for (let i = 0; i < rows.length; i += 2) {
      const vertex = rows[i];
      const weight = rows[i + 1];
      const p = Vector3.create(
        positions[3 * vertex],
        positions[3 * vertex + 1],
        positions[3 * vertex + 2],
      );
      const moved = Vector3.add(
        Vector3.add(
          Quaternion.rotateVector(
            motion.rotation,
            Vector3.subtract(p, motion.pivot),
          ),
          motion.pivot,
        ),
        motion.translation,
      );
      output[3 * vertex] += weight * (moved.x - p.x);
      output[3 * vertex + 1] += weight * (moved.y - p.y);
      output[3 * vertex + 2] += weight * (moved.z - p.z);
    }
  }
  return output;
}
