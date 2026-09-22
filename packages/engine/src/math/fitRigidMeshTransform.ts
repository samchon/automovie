import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "./Quaternion";

/**
 * Fit a proper rotation and translation between corresponding mesh vertices.
 * The facial basis builder uses this to perform a shape-edited rigid component
 * without allowing expression targets to scale, shear or reflect its geometry.
 * Inputs are flat XYZ buffers in the same units, and a nonempty, unique selection
 * indexes both. No input is mutated. Apply the returned rotation to a point minus
 * referenceCenter, then add targetCenter. Centered application avoids cancellation
 * between a large translation and a rotated absolute coordinate.
 *
 * Horn's absolute-orientation method (JOSA A 4, 1987, pp. 629–642, section 4)
 * maximizes q^T N q for a unit quaternion. N is symmetric 4 by 4; its largest
 * eigenvector gives the least-squares proper rotation. Scale is fixed at one.
 * Cyclic Jacobi rotations diagonalize N to floating precision. Normalizing the
 * centered clouds before their products keeps covariance representable across
 * coordinate scales; normalizing covariance stabilizes the solve. Repeated
 * maximal eigenvalues have multiple optimal rotations; the fixed sweep and
 * first-maximum ordering select one deterministically. A collapsed covariance
 * selects identity and the centroid translation. This fit is geometric, and
 * establishes neither a physiological joint trajectory nor nonpenetration.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Constrains a corresponding deformation target to preserve the reference component's geometry.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Finds the proper unit-scale least-squares transform for a declared rigid deformation component.
 */
export function fitRigidMeshTransform(props: {
  reference: readonly number[];
  target: readonly number[];
  vertices: readonly number[];
}): {
  rotation: IAutoMovieQuaternion;
  referenceCenter: IAutoMovieVector3;
  targetCenter: IAutoMovieVector3;
} {
  const { reference, target, vertices } = props;
  if (
    reference.length !== target.length ||
    reference.length % 3 !== 0 ||
    vertices.length === 0 ||
    new Set(vertices).size !== vertices.length ||
    vertices.some(
      (v) => !Number.isInteger(v) || v < 0 || v * 3 >= reference.length,
    )
  )
    throw new Error(
      "Rigid fitting needs aligned XYZ and distinct resident vertices.",
    );
  const a = [0, 0, 0];
  const b = [0, 0, 0];
  for (const vertex of vertices)
    for (let k = 0; k < 3; k++) {
      const x = reference[3 * vertex + k];
      const y = target[3 * vertex + k];
      if (!Number.isFinite(x) || !Number.isFinite(y))
        throw new Error("Rigid fitting needs finite corresponding positions.");
      a[k] += x / vertices.length;
      b[k] += y / vertices.length;
    }
  let referenceScale = 0;
  let targetScale = 0;
  for (const vertex of vertices)
    for (let k = 0; k < 3; k++) {
      referenceScale = Math.max(
        referenceScale,
        Math.abs(reference[3 * vertex + k] - a[k]),
      );
      targetScale = Math.max(
        targetScale,
        Math.abs(target[3 * vertex + k] - b[k]),
      );
    }
  if (![...a, ...b, referenceScale, targetScale].every(Number.isFinite))
    throw new Error("Rigid fitting exceeded finite coordinate arithmetic.");
  // Positive uniform rescaling of either cloud leaves the maximizing rotation
  // unchanged. Normalize before multiplication to avoid overflow and underflow.
  const referenceDivisor = referenceScale === 0 ? 1 : referenceScale;
  const targetDivisor = targetScale === 0 ? 1 : targetScale;
  const h = new Array<number>(9).fill(0);
  for (const vertex of vertices)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        h[3 * i + j] +=
          ((reference[3 * vertex + i] - a[i]) / referenceDivisor) *
          ((target[3 * vertex + j] - b[j]) / targetDivisor);
  const scale = Math.max(...h.map(Math.abs));
  const divisor = scale === 0 ? 1 : scale;
  const [xx, xy, xz, yx, yy, yz, zx, zy, zz] = h.map((x) => x / divisor);
  // Scalar-first quaternion convention here; convert to glTF order on return.
  const n = [
    xx + yy + zz,
    yz - zy,
    zx - xz,
    xy - yx,
    yz - zy,
    xx - yy - zz,
    xy + yx,
    zx + xz,
    zx - xz,
    xy + yx,
    -xx + yy - zz,
    yz + zy,
    xy - yx,
    zx + xz,
    yz + zy,
    -xx - yy + zz,
  ];
  const vectors = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (let sweep = 0; sweep < 24; sweep++) {
    let changed = false;
    for (let p = 0; p < 4; p++)
      for (let q = p + 1; q < 4; q++) {
        const pq = n[4 * p + q];
        if (Math.abs(pq) <= Number.EPSILON) continue;
        changed = true;
        const pp = n[4 * p + p];
        const qq = n[4 * q + q];
        const angle = Math.atan2(2 * pq, qq - pp) / 2;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        for (let k = 0; k < 4; k++) {
          if (k !== p && k !== q) {
            const kp = n[4 * k + p];
            const kq = n[4 * k + q];
            n[4 * k + p] = c * kp - s * kq;
            n[4 * p + k] = n[4 * k + p];
            n[4 * k + q] = s * kp + c * kq;
            n[4 * q + k] = n[4 * k + q];
          }
          const vp = vectors[4 * k + p];
          const vq = vectors[4 * k + q];
          vectors[4 * k + p] = c * vp - s * vq;
          vectors[4 * k + q] = s * vp + c * vq;
        }
        n[4 * p + p] = c * c * pp - 2 * s * c * pq + s * s * qq;
        n[4 * q + q] = s * s * pp + 2 * s * c * pq + c * c * qq;
        n[4 * p + q] = 0;
        n[4 * q + p] = 0;
      }
    if (!changed) break;
  }
  let largest = 0;
  for (let i = 1; i < 4; i++)
    if (n[4 * i + i] > n[4 * largest + largest]) largest = i;
  return {
    rotation: Quaternion.normalize({
      w: vectors[largest],
      x: vectors[4 + largest],
      y: vectors[8 + largest],
      z: vectors[12 + largest],
    }),
    referenceCenter: { x: a[0], y: a[1], z: a[2] },
    targetCenter: { x: b[0], y: b[1], z: b[2] },
  };
}
