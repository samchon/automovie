import type { IAutoMovieVector3 } from "@automovie/interface";
import type {
  Collider,
  TempContactManifold,
  World,
} from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Normal impulse, N s, that the native solver applied at each tracked point of
 * one contact manifold during the completed step; zero for points it did not
 * solve.
 *
 * The pinned narrow phase reduces a manifold with more than four tracked
 * points to four solver contacts and writes impulses back only to those, while
 * `contactImpulse` reads every tracked point. A point dropped from the
 * selection keeps its last impulse for as long as it stays tracked, so summing
 * every point reports a load nothing receives (dimforge/rapier#1077; a resting
 * six-point prism reads 1.46 times its weight). Each solver contact copies its
 * tracked point's distance exactly and lies at the midpoint of that point's
 * two surface witnesses, so the point with an equal distance and the nearest
 * midpoint is the one the solver used.
 *
 * @param world Native world, between steps.
 * @param manifold One manifold of the pair.
 * @param first Handle of the manifold's first collider.
 * @param second Handle of the manifold's second collider.
 * @returns One impulse per tracked point, in tracked order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the step it covers, the native defect it avoids with its upstream report, and the identity rule that maps solver contacts back to tracked points.
 * @evidence contracts/development/implementation.md#principled-implementation Rapier builds every solver contact from one selected tracked point, copying its distance and anchoring it at that point's surface witnesses, and writes the solved impulse back only to that point (pair_update.rs and writeback_impulses at the pinned rapier 0.36.0); matching on the copied distance and the witness midpoint recovers that selection, and a solver contact with no equal-distance point throws instead of guessing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the tracked points and one over the at most four solver contacts, with the witness midpoint computed by a local helper; it adds no option or layer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance decides the match: the distance comparison is exact and the position only orders equal-distance candidates; an unmatched solver contact is an error.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four solver contacts each scan the tracked points once, so the cost is linear in the manifold size with no allocation beyond the returned array and the midpoints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads one manifold of one completed step; the next step rewrites the native impulses, so nothing is reusable across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The manifold and colliders are borrowed during the call only; the returned array is the caller's.
 */
export function readPhysicalManifoldImpulses(
  world: World,
  manifold: TempContactManifold,
  first: number,
  second: number,
): number[] {
  const colliderA: Collider | undefined =
    world.colliders.get(first) ?? undefined;
  const colliderB: Collider | undefined =
    world.colliders.get(second) ?? undefined;
  if (!colliderA || !colliderB)
    throw new Error("Native contact manifold refers to a removed collider");
  const count: number = manifold.numContacts();
  const midpoints: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < count; i++)
    midpoints.push(
      Vector3.scale(
        Vector3.add(
          place(colliderA, manifold.localContactPoint1(i)!),
          place(colliderB, manifold.localContactPoint2(i)!),
        ),
        0.5,
      ),
    );
  const impulses: number[] = new Array<number>(count).fill(0);
  const used: boolean[] = new Array<boolean>(count).fill(false);
  for (let s: number = 0; s < manifold.numSolverContacts(); s++) {
    const distance: number = manifold.solverContactDist(s);
    const point: IAutoMovieVector3 = manifold.solverContactPoint(s)!;
    let chosen: number = -1;
    let nearest: number = Infinity;
    for (let i: number = 0; i < count; i++) {
      if (used[i] || manifold.contactDist(i) !== distance) continue;
      const gap: number = Vector3.length(
        Vector3.subtract(midpoints[i]!, point),
      );
      if (gap < nearest) {
        nearest = gap;
        chosen = i;
      }
    }
    if (chosen < 0)
      throw new Error("Native solver contact has no tracked manifold point");
    used[chosen] = true;
    impulses[chosen] = manifold.contactImpulse(chosen);
  }
  return impulses;
}

/** World position of a collider-local point. */
function place(
  collider: Collider,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    collider.translation(),
    Quaternion.rotateVector(collider.rotation(), local),
  );
}
