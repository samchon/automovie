import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

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
 * `unposeHumanFaceSurface` solves the inverse affine blend where its admitted linear part is nonsingular, carrying a source pose into rest space during offline preparation. Floating arithmetic still limits reconstruction.
 *
 * Normals are not transported here: the builder recomputes them on the posed
 * surface. Inputs are never mutated; results are fresh buffers.
 *
 * @evidence contracts/common.md#principled-implementation A fresh rest copy accumulates each sparse attachment weight times its owner's rigid displacement, leaving the cranium complement. Admitted rows/normalized rigid motions supply resident weights and pivots; a missing motion refuses, and blended affine skinning is authored motion rather than muscular deformation.
 * @evidence contracts/common.md#clear-and-simple-design One sparse surface operation is shared by native posing and individual-point measurement; motion resolution and normal recomputation remain with their owning stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each owner's image is measured from the original rest point, preventing sequential compound transforms from replacing the weighted blend. Unattached vertices preserve rest, missing owner motions are not ignored, and inverse recovery requires nonsingular affine blending rather than a blanket exactness claim.
 * @evidence contracts/common.md#meaningful-documentation Prose gives the weighted displacement equation, cranium complement, rigid-versus-blended interpretation, refusal, fresh output, normal ownership and qualified inverse use.
 * @evidence contracts/performance.md#efficient-algorithms Copying V coordinate scalars and visiting A sparse attachment rows costs O(V+A), with fixed three-coordinate quaternion/vector arithmetic per row. No full dense owner-weight matrix is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied motion per owner serves all its rows and output starts from one rest copy. Each request uses its current rest/motions; the outer pose cache, rather than this mutating-output calculation, owns completed-state reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives one fresh coordinate buffer; row-local vectors and owner lookups retain no references after completion or refusal. No motion history, external task or GPU resource is acquired.
 */
export function poseHumanFaceSurface(
  positions: readonly number[],
  attachments: Attachments,
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): number[] {
  const output: number[] = positions.slice();
  for (const attachment of attachments) {
    const motion: IAutoMovieHumanFaceRigidMotion | undefined = motions.get(
      attachment.owner,
    );
    if (motion === undefined)
      throw new Error(
        "Facial attachment names an owner without motion: " + attachment.owner,
      );
    const rows: number[] = attachment.rows;
    for (let i: number = 0; i < rows.length; i += 2) {
      const vertex: number = rows[i];
      const weight: number = rows[i + 1];
      const p: IAutoMovieVector3Imported = Vector3.create(
        positions[3 * vertex],
        positions[3 * vertex + 1],
        positions[3 * vertex + 2],
      );
      const moved: IAutoMovieVector3Imported = Vector3.add(
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
