import type {
  IAutoMovieSolvePhysicalCompliantContacts,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { physicalShapePairContact } from "./physicalShapePairContact";

/**
 * Apply implicit Kelvin-Voigt surface impulses to the sensor overlaps of
 * the world's last step. A compliant surface is a sensor collider; its
 * rigid core, a separate collider at the declared compression limit, takes
 * part in the rigid solve instead.
 *
 * Each overlapping pair with a compliant first surface (`surfaces`, the
 * lower collider order first) is measured once at the current poses by
 * convex signed distance (`physicalShapePairContact`); a pair that has
 * separated, or whose surfaces belong to one scene body, gets nothing. The
 * normal impulse `j` solves the implicit law over the substep `dt`, with
 * the two compliances `c_a`, `c_b` in series, the compliance-weighted
 * damping `c_d` and the effective inverse mass `w` of both bodies at the
 * witness midpoint along the normal: `j = (dt d + dt (dt + c_d) v_n) /
 * (c_a + c_b + dt (dt + c_d) w)`, evaluated in compliance-normalized form
 * and clamped at zero, where `d` is the depth and `v_n` the approach
 * speed. Coulomb friction opposes the
 * tangential slip, bounded by the mean friction times `j` and by the
 * impulse that stops the slip. Each dynamic body receives the combined
 * impulse times its surface's response gain, the first body along the
 * normal's reverse; a kinematic body receives none. A transferred impulse
 * whose Float64 product overflows throws, as does a non-finite effective
 * mass or impulse. The next step integrates the response.
 *
 * @param world The world, after a step; its sensor overlaps and bodies.
 * @param surfaces Each bound collider's compliance (m/N), damping (s), friction and gain, by handle.
 * @param seconds Seconds that stamp the measurements.
 * @param dt The substep, seconds.
 * @returns One measurement per responding pair: the handles, point, normal from the first toward the second, impulse (N s), the normal impulse each side received, and the separation (m).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sensor source, the measurement, the law with its symbols and units, the friction bound, the gains, the refusals and the returned fields.
 * @evidence contracts/development/implementation.md#principled-implementation The Kelvin-Voigt contact (spring and dashpot in parallel) integrated implicitly over one substep, with series compliance of the two surfaces; dividing every term by the larger of compliance and dt (dt + c_d) w first keeps the finite rigid limit instead of an infinity over infinity. The effective inverse mass is `1/m + (r x n) . I^-1 (r x n)` on each body (Eberly, Game Physics, 2010, ch. 6). 0.5 is the mean of the two friction coefficients.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the step's sensor overlaps; detection is the world's, distance physicalShapePairContact's, receipts recordPhysicalContact's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shape, body or material category has its own rule. Overflowing products and non-finite intermediate values throw instead of being clipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the step's sensor overlaps, one distance query and four directional inverse masses per responding pair.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads one completed step's overlaps at the current poses; nothing is reusable across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing between calls; the visited-pair set dies with the call and the measurements are the caller's.
 */
export function solvePhysicalCompliantContacts(
  world: AutoMovieXpbdWorld,
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

  /** The response of one ordered pair whose first surface is compliant; null when it has none. */
  function respond(
    first: AutoMovieXpbdCollider,
    second: AutoMovieXpbdCollider,
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
    const contact: physicalShapePairContact.IResult = physicalShapePairContact(
      first.bodyPose(),
      first.shape,
      second.bodyPose(),
      second.shape,
    );
    if (contact.distance > 0) return null;
    const parentA: AutoMovieXpbdBody = first.parent();
    const parentB: AutoMovieXpbdBody = second.parent();
    const point: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(contact.pointA, contact.pointB),
      0.5,
    );
    const normal: IAutoMovieVector3 = contact.normal;
    const velocity: IAutoMovieVector3 = Vector3.subtract(
      parentA.velocityAtPoint(point),
      parentB.velocityAtPoint(point),
    );
    const inverse: number =
      inverseMass(parentA, point, normal) + inverseMass(parentB, point, normal);
    if (!Number.isFinite(inverse))
      throw new Error("Nonfinite compliant-contact effective inverse mass");
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
        (coefficient / scale) * Vector3.dot(velocity, normal)) /
        ((compliance / scale) * (firstWeight + secondWeight) +
          (coefficient / scale) * inverse),
    );
    if (!Number.isFinite(impulse))
      throw new Error("Nonfinite compliant-contact impulse");
    if (!(impulse > 0)) return null;
    const tangent: IAutoMovieVector3 = Vector3.subtract(
      velocity,
      Vector3.scale(normal, Vector3.dot(velocity, normal)),
    );
    const speed: number = Vector3.length(tangent);
    const direction: IAutoMovieVector3 =
      speed > 0 ? Vector3.scale(tangent, 1 / speed) : { x: 0, y: 0, z: 0 };
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
    const combined: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(normal, impulse),
      Vector3.scale(direction, friction),
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

/** The impulse a body receives, the combined impulse times its signed gain; null for a kinematic body. */
function transfer(
  body: AutoMovieXpbdBody,
  combined: IAutoMovieVector3,
  gain: number,
): IAutoMovieVector3 | null {
  if (!body.isDynamic()) return null;
  const impulse: IAutoMovieVector3 = Vector3.scale(combined, gain);
  if (![impulse.x, impulse.y, impulse.z].every(Number.isFinite))
    throw new Error("Nonfinite compliant-contact transferred impulse");
  return impulse;
}

/** The normal share of the impulse a body actually received, along its side's sign; zero when it received none. */
function received(
  impulse: IAutoMovieVector3 | null,
  normal: IAutoMovieVector3,
  sign: number,
): number {
  return impulse ? Math.max(0, sign * Vector3.dot(normal, impulse)) : 0;
}

/** Directional point inverse mass `1/m + (r x n) . I^-1 (r x n)` with the rotated full inertia; zero for a kinematic body. */
function inverseMass(
  body: AutoMovieXpbdBody,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number {
  if (!body.isDynamic()) return 0;
  const cross: IAutoMovieVector3 = Vector3.cross(
    Vector3.subtract(point, body.worldCom()),
    normal,
  );
  return body.inverseMass() + Vector3.dot(cross, body.inverseInertia(cross));
}
