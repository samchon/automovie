import type { IAutoMovieTransform } from "@automovie/interface";

/*
 * Compose a parent-local TRS over a child-local TRS into one local transform.
 *
 * Folding a skipped helper node into the bone beneath it needs this, so the
 * emitted rest stays relative to the nearest kept ancestor. The result is the
 * standard rig decomposition `t = t_p + R_p (s_p * t_c)`, `r = r_p r_c`, `s =
 * s_p * s_c` with component-wise scale products. With unit quaternions,
 * translation follows affine composition and rotation and scale match its TRS
 * representation when the parent scale commutes with the child rotation, as a
 * uniform parent scale or an identity child rotation does. Otherwise the
 * product contains shear that this TRS representation drops. Floating-point
 * rounding remains, and a non-unit parent quaternion invalidates the rotation
 * formula rather than applying a uniform scale.
 *
 * The arithmetic order is fixed, so the same inputs produce bit-identical
 * output, which lets an external-motion source rig be compared with exact
 * equality against the inspected basis.
 * Parameter parent: Transform of the node nearer the root.
 * Parameter child: Transform expressed in `parent`'s space.
 * Returns: A new transform expressing `child` in the space `parent` lives in.
 */
export function composeLocalTransform(
  parent: IAutoMovieTransform,
  child: IAutoMovieTransform,
): IAutoMovieTransform {
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
}
