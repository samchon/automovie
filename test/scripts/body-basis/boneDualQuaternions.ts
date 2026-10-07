import { Quaternion } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { BodyBoneFrames } from "./BodyBoneFrames";
import type { IBodyBoneJoint } from "./IBodyBoneJoint";
import type { IBodyBoneDualQuaternion } from "./IBodyBoneDualQuaternion";
import { rotationMatrixOf } from "./rotationMatrixOf";

/**
 * Per bone, the unit dual quaternion of `posed ∘ rest⁻¹` with its sign aligned
 * to its parent's, in the order of the skin's own joint list.
 */
export function boneDualQuaternions(
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  frames: BodyBoneFrames,
  joints: readonly IBodyBoneJoint[],
): IBodyBoneDualQuaternion[] {
  const aligned = new Map<
    AutoMovieHumanoidBone,
    IBodyBoneDualQuaternion
  >();
  for (const joint of joints) {
    const frame = frames.get(joint.bone);
    if (frame === undefined) throw new Error("no frame for " + joint.bone);
    const q = Quaternion.multiply(
      frame.posed.rotation,
      Quaternion.inverse(frame.rest.rotation),
    );
    const m = rotationMatrixOf(q);
    const rp = frame.rest.position;
    const pp = frame.posed.position;
    const t = [
      pp.x - (m[0][0] * rp.x + m[0][1] * rp.y + m[0][2] * rp.z),
      pp.y - (m[1][0] * rp.x + m[1][1] * rp.y + m[1][2] * rp.z),
      pp.z - (m[2][0] * rp.x + m[2][1] * rp.y + m[2][2] * rp.z),
    ];
    const dual = {
      x: 0.5 * (t[0] * q.w + t[1] * q.z - t[2] * q.y),
      y: 0.5 * (-t[0] * q.z + t[1] * q.w + t[2] * q.x),
      z: 0.5 * (t[0] * q.y - t[1] * q.x + t[2] * q.w),
      w: 0.5 * (-t[0] * q.x - t[1] * q.y - t[2] * q.z),
    };
    const parent =
      joint.parent === null ? undefined : aligned.get(joint.parent);
    const sign =
      parent !== undefined &&
      parent.real.x * q.x +
        parent.real.y * q.y +
        parent.real.z * q.z +
        parent.real.w * q.w <
        0
        ? -1
        : 1;
    aligned.set(joint.bone, {
      real: { x: sign * q.x, y: sign * q.y, z: sign * q.z, w: sign * q.w },
      dual: {
        x: sign * dual.x,
        y: sign * dual.y,
        z: sign * dual.z,
        w: sign * dual.w,
      },
    });
  }
  return skin.joints.map((bone) => aligned.get(bone)!);
}
