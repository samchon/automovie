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
 * @evidence contracts/common.md#principled-implementation Linear blend skinning in its residual form p + sum w_o (M_o(p) - p) equals (1 - sum w) p + sum w M_o(p); a vertex with weight one follows its rigid owner exactly and the complement stays on the cranium. Each rigid map is rotate about the pivot then translate. The known limitation of linear blending (volume loss at large relative rotations) is inherent to the method.
 * @evidence contracts/common.md#clear-and-simple-design A single loop over the sparse attachment rows; the motions are supplied by the articulation owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path; an owner without motion throws.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the exact inverse's location and the no-mutation rule.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the Y-up +Z-anterior head frame for positions, pivots and translations; rotations are unit quaternions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping poseHumanFaceSurface is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels poseHumanFaceSurface defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry poseHumanFaceSurface decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries poseHumanFaceSurface constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation poseHumanFaceSurface owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source poseHumanFaceSurface carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range poseHumanFaceSurface admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority poseHumanFaceSurface defines no input through which a caller shapes a human form.
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
