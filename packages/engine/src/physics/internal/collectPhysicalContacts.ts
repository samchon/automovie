import type {
  IAutoMovieContactReceipt,
  IAutoMoviePerformanceMode,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import type { AutoMovieXpbdWorld } from "../AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import { recordPhysicalContact } from "./recordPhysicalContact";

/*
 * Record the rigid contacts the world's last step solved, one receipt sample
 * per touching collider pair, in the world's canonical pair order
 * (`AutoMovieXpbdWorld.manifolds`: creation order of the first collider, then
 * of the second).
 *
 * A manifold's impulse is the sum of the normal impulses the step applied at
 * its patch points, newton seconds over the substep; its separation is the
 * least end-of-step separation of those points, metres; its point is the first
 * patch point's witness midpoint; its normal points from the first collider
 * toward the second. A manifold that received no positive impulse, or whose
 * points all ended separated, records nothing. Sensor overlaps are not
 * manifolds; the compliant law reads them. Pairs of one scene body's own
 * colliders and colliders the binding does not identify are skipped. A body in
 * exaggerated mode then receives the extra share `(gain - 1)` of the impulse
 * its side took, at the same point, so its response is the declared multiple of
 * the solved one; a share whose Float64 product overflows throws instead of
 * giving the body an infinite velocity.
 * Parameter world: The world, after a step.
 * Parameter input: The admitted simulation input; its bodies' modes and rate.
 * Parameter bound: The world's binding: collider identities and segment bodies.
 * Parameter seconds: Cache-frame seconds that stamp the samples.
 * Parameter contacts: The run's receipts, appended to.
 * Parameter active: Open receipts by pair key, updated.
 * Parameter found: Pair keys touched in this cache frame, added to.
 */
export function collectPhysicalContacts(
  world: AutoMovieXpbdWorld,
  input: IAutoMoviePhysicalSimulationInput.IInput,
  bound: Bound,
  seconds: number,
  contacts: IAutoMovieContactReceipt[],
  active: Map<string, IAutoMovieContactReceipt>,
  found: Set<string>,
): void {
  for (const manifold of world.manifolds()) {
    const a: IAutoMovieContactReceipt["a"] | undefined = bound.colliders.get(
      manifold.a.handle,
    );
    const b: IAutoMovieContactReceipt["a"] | undefined = bound.colliders.get(
      manifold.b.handle,
    );
    if (!a || !b || a.body === b.body || manifold.points.length === 0) continue;
    let impulse: number = 0;
    let separation: number = Infinity;
    for (const point of manifold.points) {
      impulse += point.impulse;
      separation = Math.min(separation, point.separation);
    }
    if (!(impulse > 0) || separation > 0) continue;
    const point: IAutoMovieVector3 = manifold.points[0]!.point;
    const normal: IAutoMovieVector3 = manifold.normal;
    recordPhysicalContact({
      a,
      b,
      seconds,
      dt: 1 / input.rate,
      point,
      normal,
      impulse,
      separation,
      contacts,
      active,
      found,
    });

    // The first collider took -impulse along the normal, the second +impulse.
    for (const [side, sign] of [
      [a, -1],
      [b, 1],
    ] as const) {
      const policy: IAutoMoviePerformanceMode | undefined = input.bodies.find(
        (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
          candidate.id === side.body,
      )?.mode;
      if (policy?.kind !== "exaggerated") continue;
      const extra: number = sign * impulse * (policy.impulse - 1);
      bound.bodies
        .get(`${side.body}/${side.bone}`)!
        .applyImpulseAtPoint(Vector3.scale(normal, extra), point);
    }
  }
}
