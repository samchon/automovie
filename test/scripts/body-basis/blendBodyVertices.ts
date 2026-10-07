import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { BodyBoneFrames } from "./BodyBoneFrames";
import type { IBodyBoneJoint } from "./IBodyBoneJoint";
import type { IBodyVertexBlend } from "./IBodyVertexBlend";
import { boneDualQuaternions } from "./boneDualQuaternions";
import { rotationMatrixOf } from "./rotationMatrixOf";

/**
 * The blended rigid transform of every vertex. The four weights of a vertex
 * blend the bones' dual quaternions, the sum is divided by the norm of its
 * real part, and the translation is
 * `2 · dual · conjugate(real)`. Requires every bone the skin names to have a
 * frame; a missing bone, cancelled blend or nonfinite blend throws. No unit
 * denominator replaces an undefined rigid transform. Corrective consumers
 * still verify current shape/contact through the public body builder.
 */
export function blendBodyVertices(
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  frames: BodyBoneFrames,
  vertices: number,
  joints: readonly IBodyBoneJoint[],
): IBodyVertexBlend[] {
  const bones = boneDualQuaternions(skin, frames, joints);
  const out: IBodyVertexBlend[] = [];
  for (let v = 0; v < vertices; v++) {
    const real = { x: 0, y: 0, z: 0, w: 0 };
    const dual = { x: 0, y: 0, z: 0, w: 0 };
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = bones[skin.boneIndices[v * 4 + k]];
      for (const key of ["x", "y", "z", "w"] as const) {
        real[key] += weight * bone.real[key];
        dual[key] += weight * bone.dual[key];
      }
    }
    const size = Math.hypot(real.x, real.y, real.z, real.w);
    if (
      !(size > 0) ||
      !Number.isFinite(size) ||
      [dual.x, dual.y, dual.z, dual.w].some((value) => !Number.isFinite(value))
    )
      throw new Error(
        `Body corrective vertex ${v} has an undefined dual-quaternion blend.`,
      );
    for (const key of ["x", "y", "z", "w"] as const) {
      real[key] /= size;
      dual[key] /= size;
    }
    out.push({
      rotation: rotationMatrixOf(real),
      translation: [
        2 *
          (-dual.w * real.x +
            dual.x * real.w -
            dual.y * real.z +
            dual.z * real.y),
        2 *
          (-dual.w * real.y +
            dual.x * real.z +
            dual.y * real.w -
            dual.z * real.x),
        2 *
          (-dual.w * real.z -
            dual.x * real.y +
            dual.y * real.x +
            dual.z * real.w),
      ],
    });
  }
  return out;
}
