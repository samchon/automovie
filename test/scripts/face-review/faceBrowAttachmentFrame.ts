import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * An internal attachment chart on an explicitly named host triangle. Positions
 * and the barycentric origin use metres; the right-handed axes are unit vectors.
 * The reference direction fixes a tangent convention, not biological emergence.
 * No carrier vertex is interpreted as a follicle. New host positions require a
 * new frame. Inputs are retained unchanged and outputs own their arrays.
 *
 * A barycentric sum accepts only arithmetic roundoff (32 machine epsilons).
 * The tangent must be numerically independent of the normal; a near-parallel
 * reference refuses rather than selecting an unrelated fallback direction.
 */
export function faceBrowAttachmentFrame(
  mesh: Pick<IAutoMovieMesh, "positions" | "indices">,
  attachment: {
    triangle: number;
    weights: readonly [number, number, number];
    reference: readonly [number, number, number];
  },
): {
  origin: number[];
  tangent: number[];
  across: number[];
  normal: number[];
  intoMillimetres: (point: readonly number[]) => number[];
  outOfMetres: (point: readonly number[]) => number[];
  directionOut: (direction: readonly number[]) => number[];
} {
  const indices = mesh.indices;
  if (indices === null || indices.length % 3 !== 0 ||
      !Number.isInteger(attachment.triangle) || attachment.triangle < 0 ||
      attachment.triangle >= indices.length / 3)
    throw new Error("Brow attachment needs a resident host triangle.");
  const weights = [...attachment.weights];
  if (weights.length !== 3 || weights.some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 1) ||
      Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) > 32 * Number.EPSILON)
    throw new Error("Brow attachment needs barycentric weights summing to one.");
  const points = indices.slice(3 * attachment.triangle, 3 * attachment.triangle + 3).map((id) => {
    if (!Number.isInteger(id) || id < 0 || 3 * id + 2 >= mesh.positions.length)
      throw new Error("Brow attachment triangle needs resident vertex identities.");
    const xyz = [mesh.positions[3 * id], mesh.positions[3 * id + 1], mesh.positions[3 * id + 2]];
    if (!xyz.every(Number.isFinite))
      throw new Error("Brow attachment triangle needs finite metre coordinates.");
    return Vector3.create(xyz[0], xyz[1], xyz[2]);
  });
  const normalRaw = Vector3.cross(Vector3.subtract(points[1], points[0]), Vector3.subtract(points[2], points[0]));
  const normalLength = Vector3.length(normalRaw);
  if (!(normalLength > 0) || !Number.isFinite(normalLength))
    throw new Error("Brow attachment needs a nondegenerate finite host triangle.");
  const normal = Vector3.normalize(normalRaw);
  if (attachment.reference.length !== 3 || ![...attachment.reference].every(Number.isFinite))
    throw new Error("Brow attachment reference needs three finite coordinates.");
  const reference = Vector3.create(...attachment.reference);
  const referenceLength = Vector3.length(reference);
  const acrossRaw = Vector3.cross(normal, reference);
  const acrossLength = Vector3.length(acrossRaw);
  if (!Number.isFinite(referenceLength) || !Number.isFinite(acrossLength) ||
      !(acrossLength > 64 * Number.EPSILON * referenceLength))
    throw new Error("Brow attachment reference must be independent of its normal.");
  const across = Vector3.normalize(acrossRaw);
  const tangent = Vector3.cross(across, normal);
  const origin = ["x", "y", "z"].map((axis) => points.reduce((sum, point, index) =>
    sum + point[axis as "x" | "y" | "z"] * weights[index], 0));
  const axes = [[tangent.x, tangent.y, tangent.z], [across.x, across.y, across.z], [normal.x, normal.y, normal.z]];
  const requirePoint = (point: readonly number[]) => {
    if (point.length !== 3 || ![...point].every(Number.isFinite))
      throw new Error("Brow frame conversions need three finite coordinates.");
  };
  const directionOut = (point: readonly number[]) => {
    requirePoint(point);
    return origin.map((_, axis) => axes.reduce((sum, basis, index) => sum + basis[axis] * point[index], 0));
  };
  return { origin: [...origin], tangent: [...axes[0]], across: [...axes[1]], normal: [...axes[2]],
    intoMillimetres: (point) => {
      requirePoint(point);
      return axes.map((axis) => axis.reduce((sum, value, index) => sum + value * (point[index] - origin[index]), 0) * 1000);
    },
    outOfMetres: (point) => directionOut(point).map((value, axis) => value + origin[axis]),
    directionOut,
  };
}
