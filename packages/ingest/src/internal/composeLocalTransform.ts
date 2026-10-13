import type { IAutoMovieTransform } from "@automovie/interface";

/**
 * Compose a parent-local TRS over a child-local TRS into one local transform.
 *
 * Folding a skipped helper node into the bone beneath it needs this, so the
 * emitted rest stays relative to the nearest kept ancestor. The result is the
 * standard rig decomposition `t = t_p + R_p (s_p * t_c)`, `r = r_p r_c`,
 * `s = s_p * s_c` with component-wise scale products. The translation is
 * always exact; the rotation and scale are exact when the parent scale commutes
 * with the child rotation, as a uniform parent scale or an identity child
 * rotation does. Otherwise the true product contains shear that a TRS cannot
 * hold, and the result drops it. Rotations are expected to be unit
 * quaternions; a non-unit parent rotation scales the rotated translation.
 *
 * The arithmetic order is fixed, so the same inputs produce bit-identical
 * output, which lets an external-motion source rig be compared with exact
 * equality against the inspected basis.
 *
 * @param parent Transform of the node nearer the root.
 * @param child Transform expressed in `parent`'s space.
 * @returns A new transform expressing `child` in the space `parent` lives in.
 *
 * @evidence contracts/common.md#principled-implementation The translation applies the parent's scale, then its unit-quaternion rotation through `v + w t + q x t` with `t = 2 q x v`, then its offset; the rotation is the Hamilton product and the scale is component-wise, which is exact whenever the parent scale commutes with the child rotation, as the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One function serves both humanoid import and motion adoption, which previously carried two separately written copies of the same formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The arithmetic order matches both former copies term by term, so outputs are bit-identical to what each caller produced, and no input is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why helpers are folded, the formula, when it is exact and what it drops, the unit-rotation premise, and that fixed arithmetic order makes exact comparison reproducible.
 * @evidence contracts/performance.md#efficient-algorithms Constant work of about forty multiply-adds and one result allocation per call, with no intermediate vector objects.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time pure function has nothing worth caching; callers fold each helper once per bone.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing; its single result object belongs to the caller.
 * @author Samchon
 */
export const composeLocalTransform = (
  parent: IAutoMovieTransform,
  child: IAutoMovieTransform,
): IAutoMovieTransform => {
  const q: IAutoMovieTransform["rotation"] = parent.rotation;
  const vx: number = parent.scale.x * child.translation.x;
  const vy: number = parent.scale.y * child.translation.y;
  const vz: number = parent.scale.z * child.translation.z;
  // v' = v + w t + q x t with t = 2 (q x v), the unit-quaternion rotation.
  const tx: number = 2 * (q.y * vz - q.z * vy);
  const ty: number = 2 * (q.z * vx - q.x * vz);
  const tz: number = 2 * (q.x * vy - q.y * vx);
  const r: IAutoMovieTransform["rotation"] = child.rotation;
  return {
    translation: {
      x: parent.translation.x + (vx + q.w * tx + (q.y * tz - q.z * ty)),
      y: parent.translation.y + (vy + q.w * ty + (q.z * tx - q.x * tz)),
      z: parent.translation.z + (vz + q.w * tz + (q.x * ty - q.y * tx)),
    },
    rotation: {
      x: q.w * r.x + q.x * r.w + q.y * r.z - q.z * r.y,
      y: q.w * r.y - q.x * r.z + q.y * r.w + q.z * r.x,
      z: q.w * r.z + q.x * r.y - q.y * r.x + q.z * r.w,
      w: q.w * r.w - q.x * r.x - q.y * r.y - q.z * r.z,
    },
    scale: {
      x: parent.scale.x * child.scale.x,
      y: parent.scale.y * child.scale.y,
      z: parent.scale.z * child.scale.z,
    },
  };
};
