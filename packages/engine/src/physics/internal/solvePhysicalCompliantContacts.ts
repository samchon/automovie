import type {
  IAutoMoviePhysicalShapePairContact,
  IAutoMovieSolvePhysicalCompliantContacts,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import type { AutoMovieEngineXpbdCollider } from "../AutoMovieEngineXpbdCollider";
import type { AutoMovieEngineXpbdWorld } from "../AutoMovieEngineXpbdWorld";
import { physicalShapePairContact } from "./physicalShapePairContact";

/*
 * Apply implicit Kelvin-Voigt surface impulses to the sensor overlaps of the
 * world's last step. A compliant surface is a sensor collider; its rigid core,
 * a separate collider at the declared compression limit, takes part in the
 * rigid solve instead.
 *
 * Each overlapping pair with a compliant first surface (`surfaces`, the lower
 * collider order first) is measured once at the current poses by convex signed
 * distance (`physicalShapePairContact`); a pair that has separated, or whose
 * surfaces belong to one scene body, gets nothing. The normal impulse `j`
 * solves the implicit law over the substep `dt`, with the two compliances
 * `c_a`, `c_b` in series, the compliance-weighted damping `c_d` and the
 * effective inverse mass `w` of both bodies at the witness midpoint along the
 * normal: `j = (dt d + dt (dt + c_d) v_n) / (c_a + c_b + dt (dt + c_d) w)`,
 * evaluated in compliance-normalized form and clamped at zero, where `d` is the
 * depth and `v_n` the approach speed. Coulomb friction opposes the tangential
 * slip, bounded by the mean friction times `j` and by the impulse that stops
 * the slip. Each dynamic body receives the combined impulse times its surface's
 * response gain, the first body along the normal's reverse; a kinematic body
 * receives none. A transferred impulse whose Float64 product overflows throws,
 * as does a non-finite effective mass or impulse. The next step integrates the
 * response.
 * Parameter world: The world, after a step; its sensor overlaps and bodies.
 * Parameter surfaces: Each bound collider's compliance (m/N), damping (s), friction
 * and gain, by handle.
 * Parameter seconds: Seconds that stamp the measurements.
 * Parameter dt: The substep, seconds.
 * Returns: One measurement per responding pair: the handles, point, normal from
 * the first toward the second, impulse (N s), the normal impulse each side
 * received, and the separation (m).
 */
export function solvePhysicalCompliantContacts(
  world: AutoMovieEngineXpbdWorld,
  surfaces: ReadonlyMap<
    number,
    IAutoMovieSolvePhysicalCompliantContacts.ISurface
  >,
  seconds: number,
  dt: number,
): IAutoMovieSolvePhysicalCompliantContacts.IMeasurement[] {
  const results: IAutoMovieSolvePhysicalCompliantContacts.IMeasurement[] = [];
  const visited: Set<string> = new Set();
  for (const overlap of world.intersections())
    for (const [first, second] of [
      [overlap.a, overlap.b],
      [overlap.b, overlap.a],
    ] as const) {
      const measured: IAutoMovieSolvePhysicalCompliantContacts.IMeasurement | null =
        respond(first, second);
      if (measured !== null) results.push(measured);
    }
  return results;

  /*
   * The response of one ordered pair whose first surface is compliant; null
   * when it has none.
   */
  function respond(
    first: AutoMovieEngineXpbdCollider,
    second: AutoMovieEngineXpbdCollider,
  ): IAutoMovieSolvePhysicalCompliantContacts.IMeasurement | null {
    const handle: number = first.handle;
    const other: number = second.handle;
    const a: IAutoMovieSolvePhysicalCompliantContacts.ISurface | undefined =
      surfaces.get(handle);
    const b: IAutoMovieSolvePhysicalCompliantContacts.ISurface | undefined =
      surfaces.get(other);
    const key: string = `${Math.min(handle, other)}:${Math.max(handle, other)}`;
    if (!a || a.compliance === 0 || !b || a.body === b.body || visited.has(key))
      return null;
    visited.add(key);
    const contact: IAutoMoviePhysicalShapePairContact =
      physicalShapePairContact(
        first.bodyPose(),
        first.shape,
        second.bodyPose(),
        second.shape,
      );
    if (contact.distance > 0) return null;
    const parentA: AutoMovieEngineXpbdBody = first.parent();
    const parentB: AutoMovieEngineXpbdBody = second.parent();
    const point: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(contact.pointA, contact.pointB),
      0.5,
    );
    const normal: IAutoMovieVector3 = contact.normal;
    const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      parentA.velocityAtPoint(point),
      parentB.velocityAtPoint(point),
    );
    const inverse: number =
      inverseMass(parentA, point, normal) + inverseMass(parentB, point, normal);

    if (!(inverse > 0)) return null;

    // Normalize before adding compliances or multiplying by damping. Dividing
    // the implicit law by compliance first creates infinity/infinity for an
    // otherwise finite stiff limit; this algebra retains that finite limit.
    const compliance: number = Math.max(a.compliance, b.compliance);
    const firstWeight: number = a.compliance / compliance;
    const secondWeight: number = b.compliance / compliance;
    const damping: number =
      (firstWeight * a.damping + secondWeight * b.damping) /
      (firstWeight + secondWeight);
    const coefficient: number = dt * (dt + damping);
    const scale: number = Math.max(compliance, coefficient * inverse);
    const impulse: number = Math.max(
      0,
      ((dt / scale) * -contact.distance +
        (coefficient / scale) * AutoMovieEngineVector3.dot(velocity, normal)) /
        ((compliance / scale) * (firstWeight + secondWeight) +
          (coefficient / scale) * inverse),
    );

    if (!(impulse > 0)) return null;
    const tangent: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      velocity,
      AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(velocity, normal)),
    );
    const speed: number = AutoMovieEngineVector3.length(tangent);
    const direction: IAutoMovieVector3 =
      speed > 0
        ? { x: tangent.x / speed, y: tangent.y / speed, z: tangent.z / speed }
        : { x: 0, y: 0, z: 0 };
    const tangentInverse: number =
      inverseMass(parentA, point, direction) +
      inverseMass(parentB, point, direction);
    const friction: number =
      tangentInverse > 0
        ? Math.min(
            (a.friction + b.friction) * 0.5 * impulse,
            speed / tangentInverse,
          )
        : 0;
    const combined: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(normal, impulse),
      AutoMovieEngineVector3.scale(direction, friction),
    );
    const firstImpulse: IAutoMovieVector3 | null = transfer(
      parentA,
      combined,
      -a.gain,
    );
    const secondImpulse: IAutoMovieVector3 | null = transfer(
      parentB,
      combined,
      b.gain,
    );
    if (firstImpulse) parentA.applyImpulseAtPoint(firstImpulse, point);
    if (secondImpulse) parentB.applyImpulseAtPoint(secondImpulse, point);
    return {
      handle,
      other,
      seconds,
      point,
      normal,
      impulse,
      appliedImpulse: {
        a: received(firstImpulse, normal, -1),
        b: received(secondImpulse, normal, 1),
      },
      separation: contact.distance,
    };
  }
}

/*
 * The impulse a body receives, the combined impulse times its signed gain; null
 * for a kinematic body.
 */
function transfer(
  body: AutoMovieEngineXpbdBody,
  combined: IAutoMovieVector3,
  gain: number,
): IAutoMovieVector3 | null {
  if (!body.isDynamic()) return null;
  return AutoMovieEngineVector3.scale(combined, gain);
}

/*
 * The normal share of the impulse a body actually received, along its side's
 * sign; zero when it received none.
 */
function received(
  impulse: IAutoMovieVector3 | null,
  normal: IAutoMovieVector3,
  sign: number,
): number {
  return impulse ? Math.max(0, sign * AutoMovieEngineVector3.dot(normal, impulse)) : 0;
}

/*
 * Directional point inverse mass `1/m + (r x n) . I^-1 (r x n)` with the
 * rotated full inertia; zero for a kinematic body.
 */
function inverseMass(
  body: AutoMovieEngineXpbdBody,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number {
  if (!body.isDynamic()) return 0;
  const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
    AutoMovieEngineVector3.subtract(point, body.worldCom()),
    normal,
  );
  return body.inverseMass() + AutoMovieEngineVector3.dot(cross, body.inverseInertia(cross));
}
