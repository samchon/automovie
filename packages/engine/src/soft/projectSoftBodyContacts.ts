import { IAutoMovieSoftCollider, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";
/** Project one unanchored particle through authored static colliders, then resolved moving capsules, preserving the running contact count.
 *
 * @evidence contracts/common.md#principled-implementation Half-spaces, spheres, axis-aligned boxes and capsules use their existing analytic escape predicates in declaration order. This is discrete endpoint projection, not continuous collision detection or simultaneous nonpenetration proof; later projection may reenter an earlier collider.
 * @evidence contracts/common.md#clear-and-simple-design Both integration paths share one contact phase and its geometric owners, while boundary admission and anchored-particle exclusion remain with their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original capsule-axis fallback and strict box tie ordering are preserved, including their degenerate symmetry limitations; no inferred body collider or hidden self-collision solve is added.
 * @evidence contracts/common.md#meaningful-documentation States contact ordering, counter meaning and discrete-projection limitations.
 * @evidence contracts/performance.md#efficient-algorithms For C static colliders and B resolved capsules, one particle costs O(C+B) time with fixed scalar/short-array temporaries; no mesh search or contact-history structure is built.
 * @evidence contracts/performance.md#reuse-equivalent-work Static and moving solves reuse identical projection code but reevaluate each particle's current coordinates; contact results cannot be cached across moved positions or boundaries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned predicted triple is updated in place, collider rows are read only, and only the updated count survives the call.
 */
export const projectSoftBodyContacts: (colliders: IAutoMovieSoftCollider[], capsules: readonly IAutoMovieSoftBodyResolvedCapsule[] | null, predicted: Float64Array<ArrayBufferLike>, particle: number, contacts: number) => number = (colliders: IAutoMovieSoftCollider[], capsules: readonly IAutoMovieSoftBodyResolvedCapsule[] | null, predicted: Float64Array, particle: number, contacts: number): number => {
  let total: number = contacts;
  total += resolveContacts(colliders, predicted, particle);
  if (capsules !== null) total += resolveCapsuleContacts(capsules, predicted, particle);
  return total;
};

/** Visit static collider rows in order, counting a projection when any coordinate changes. */
const resolveContacts: (colliders: IAutoMovieSoftCollider[], predicted: Float64Array<ArrayBufferLike>, particle: number) => number = (
  colliders: IAutoMovieSoftCollider[],
  predicted: Float64Array,
  particle: number,
): number => {
  const base: number = particle * 3;
  let resolved: number = 0;
  for (const collider of colliders) {
    const wasX: number = predicted[base];
    const wasY: number = predicted[base + 1];
    const wasZ: number = predicted[base + 2];
    if (collider.kind === "plane") escapePlane(collider, predicted, base);
    else if (collider.kind === "sphere")
      escapeSphere(collider, predicted, base);
    else if (collider.kind === "box") escapeBox(collider, predicted, base);
    if (
      predicted[base] !== wasX ||
      predicted[base + 1] !== wasY ||
      predicted[base + 2] !== wasZ
    )
      ++resolved;
  }
  return resolved;
};

/** Visit resolved moving capsules in order after static projection, using the same coordinate-change count. */
const resolveCapsuleContacts: (capsules: readonly IAutoMovieSoftBodyResolvedCapsule[], predicted: Float64Array<ArrayBufferLike>, particle: number) => number = (
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[],
  predicted: Float64Array,
  particle: number,
): number => {
  const base: number = particle * 3;
  let resolved: number = 0;
  for (const capsule of capsules) {
    const wasX: number = predicted[base];
    const wasY: number = predicted[base + 1];
    const wasZ: number = predicted[base + 2];
    escapeCapsule(capsule, predicted, base);
    if (
      predicted[base] !== wasX ||
      predicted[base + 1] !== wasY ||
      predicted[base + 2] !== wasZ
    )
      ++resolved;
  }
  return resolved;
};

/** Escape a capsule's nearest segment point; zero axial distance uses the original deterministic fallback axis. */
const escapeCapsule: (capsule: IAutoMovieSoftBodyResolvedCapsule, predicted: Float64Array<ArrayBufferLike>, base: number) => void = (
  capsule: IAutoMovieSoftBodyResolvedCapsule,
  predicted: Float64Array,
  base: number,
): void => {
  const sx: number = capsule.to.x - capsule.from.x;
  const sy: number = capsule.to.y - capsule.from.y;
  const sz: number = capsule.to.z - capsule.from.z;
  const span: number = sx * sx + sy * sy + sz * sz;
  const along: number =
    span === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((predicted[base] - capsule.from.x) * sx +
              (predicted[base + 1] - capsule.from.y) * sy +
              (predicted[base + 2] - capsule.from.z) * sz) /
              span,
          ),
        );
  const closestX: number = capsule.from.x + sx * along;
  const closestY: number = capsule.from.y + sy * along;
  const closestZ: number = capsule.from.z + sz * along;
  let dx: number = predicted[base] - closestX;
  let dy: number = predicted[base + 1] - closestY;
  let dz: number = predicted[base + 2] - closestZ;
  let softBodyParticleDistance: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (softBodyParticleDistance >= capsule.radius) return;
  if (softBodyParticleDistance === 0) {
    if (span === 0) {
      dx = 0;
      dy = 1;
      dz = 0;
    } else {
      // Cross the segment with the least-aligned cardinal axis, so the escape
      // direction is radial even for a vertical capsule.
      const length: number = Math.sqrt(span);
      const nx: number = sx / length;
      const ny: number = sy / length;
      const nz: number = sz / length;
      if (Math.abs(nx) <= Math.abs(ny) && Math.abs(nx) <= Math.abs(nz)) {
        dx = 0;
        dy = nz;
        dz = -ny;
      } else if (Math.abs(ny) <= Math.abs(nz)) {
        dx = -nz;
        dy = 0;
        dz = nx;
      } else {
        dx = ny;
        dy = -nx;
        dz = 0;
      }
      softBodyParticleDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    softBodyParticleDistance = softBodyParticleDistance === 0 ? 1 : softBodyParticleDistance;
  }
  const factor: number = capsule.radius / softBodyParticleDistance;
  predicted[base] = closestX + dx * factor;
  predicted[base + 1] = closestY + dy * factor;
  predicted[base + 2] = closestZ + dz * factor;
};

/** Move a penetrating point along the admitted plane normal; normal scale remains the domain validator's responsibility. */
const escapePlane: (collider: IAutoMovieSoftCollider.IPlane, predicted: Float64Array<ArrayBufferLike>, base: number) => void = (
  collider: IAutoMovieSoftCollider.IPlane,
  predicted: Float64Array,
  base: number,
): void => {
  const normal: IAutoMovieVector3 = collider.normal;
  const length: number = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z,
  );
  const nx: number = normal.x / length;
  const ny: number = normal.y / length;
  const nz: number = normal.z / length;
  const signed: number =
    nx * predicted[base] + ny * predicted[base + 1] + nz * predicted[base + 2];
  if (signed >= collider.offset) return;
  const push: number = collider.offset - signed;
  predicted[base] += nx * push;
  predicted[base + 1] += ny * push;
  predicted[base + 2] += nz * push;
};

/** Escape a sphere radially, with the original centre fallback when no radial direction exists. */
const escapeSphere: (collider: IAutoMovieSoftCollider.ISphere, predicted: Float64Array<ArrayBufferLike>, base: number) => void = (
  collider: IAutoMovieSoftCollider.ISphere,
  predicted: Float64Array,
  base: number,
): void => {
  const dx: number = predicted[base] - collider.center.x;
  const dy: number = predicted[base + 1] - collider.center.y;
  const dz: number = predicted[base + 2] - collider.center.z;
  const length: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (length >= collider.radius) return;
  if (length === 0) {
    // A particle exactly at the centre has no radius to escape along. It leaves
    // upward, which is where furniture pushes fabric in a gravity field, and it
    // is stated rather than left to whichever axis happened to be first.
    predicted[base + 1] = collider.center.y + collider.radius;
    return;
  }
  const factor: number = collider.radius / length;
  predicted[base] = collider.center.x + dx * factor;
  predicted[base + 1] = collider.center.y + dy * factor;
  predicted[base + 2] = collider.center.z + dz * factor;
};

/** Choose the strictly least-penetrated box face; first-axis and maximum-side ties preserve the original deterministic policy. */
const escapeBox: (collider: IAutoMovieSoftCollider.IBox, predicted: Float64Array<ArrayBufferLike>, base: number) => void = (
  collider: IAutoMovieSoftCollider.IBox,
  predicted: Float64Array,
  base: number,
): void => {
  const min: number[] = [collider.min.x, collider.min.y, collider.min.z];
  const max: number[] = [collider.max.x, collider.max.y, collider.max.z];
  for (let axis: number = 0; axis < 3; ++axis)
    if (
      predicted[base + axis] <= min[axis] ||
      predicted[base + axis] >= max[axis]
    )
      return;
  let bestAxis: number = 0;
  let bestDepth: number = Infinity;
  let bestTarget: number = 0;
  for (let axis: number = 0; axis < 3; ++axis) {
    const low: number = predicted[base + axis] - min[axis];
    const high: number = max[axis] - predicted[base + axis];
    const depth: number = low < high ? low : high;
    if (depth < bestDepth) {
      bestDepth = depth;
      bestAxis = axis;
      bestTarget = low < high ? min[axis] : max[axis];
    }
  }
  predicted[base + bestAxis] = bestTarget;
};
