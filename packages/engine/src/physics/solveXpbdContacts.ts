import type {
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdCollider } from "./AutoMovieXpbdCollider";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import { physicalShapeContactManifold } from "./physicalShapeContactManifold";
import { physicalShapePairContact } from "./physicalShapePairContact";
import { physicalShapePenetration } from "./physicalShapePenetration";

/**
 * The contact phase of one extended position-based dynamics step (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, section 3.5 and 3.6).
 *
 * `detect` finds the overlapping collider pairs at the step's predicted poses
 * and keeps each one's witnesses in its bodies' frames. `positions` resolves
 * each contact's depth beyond the allowed error along its fixed normal, as a
 * compliant constraint whose stiffness is a spring of the world's contact
 * frequency on the pair's effective mass (Macklin, Mueller and Chentanez 2016:
 * compliance `alpha = 1 / k`), and removes its tangential slip up to the
 * friction cone `lambda_t <= mu lambda_n`, each point taking the share its own
 * normal multiplier allows. `velocities`, one Gauss-Seidel sweep over the
 * points that the world repeats as often as the position passes, applies
 * dynamic friction, an impulse against the slip of at most what the cone leaves
 * over all sweeps, `(mu lambda_n - lambda_t) / h`, and at most what stops the
 * slip, then sets the normal velocity to the restitution of the pre-step
 * approach when that approach is faster than gravity gives in two substeps, and
 * to rest otherwise.
 */
export namespace solveXpbdContacts {
  /**
   * One contact of a step: the pair, its normal and witnesses, and its
   * multipliers.
   */
  export interface IContact {
    /** The first collider. */
    a: AutoMovieXpbdCollider;

    /** The second collider. */
    b: AutoMovieXpbdCollider;

    /**
     * Index of the collider pair among the step's touching pairs; the points of
     * one manifold share it.
     */
    pair: number;

    /**
     * Unit world normal from the first collider toward the second, fixed for
     * the step.
     */
    normal: IAutoMovieVector3;

    /** The first witness in the first body's frame, from its centre, metres. */
    localA: IAutoMovieVector3;

    /** The second witness in the second body's frame, from its centre, metres. */
    localB: IAutoMovieVector3;

    /** Combined Coulomb friction coefficient. */
    friction: number;

    /** Combined restitution coefficient. */
    restitution: number;

    /** Normal multiplier accumulated this step, newton seconds squared. */
    normalLambda: number;

    /**
     * Tangential multiplier vector accumulated this step, newton seconds
     * squared.
     */
    tangentLambda: IAutoMovieVector3;
    /**
     * Dynamic friction impulse accumulated over this step's velocity passes,
     * newton seconds.
     */
    tangentImpulse: number;

    /**
     * The same dynamic friction as a vector, the impulse the first body
     * received, newton seconds.
     */
    frictionImpulse: IAutoMovieVector3;

    /** Normal approach speed at detection, metres per second; positive closing. */
    approach: number;

    /** Signed distance at the end of the step, metres. */
    separation: number;

    /**
     * Signed distance where the step found the contact, before any correction,
     * metres.
     */
    detected: number;

    /**
     * Normal impulse of the velocity passes, newton seconds; positive pushing
     * the pair apart.
     */
    velocityImpulse: number;
  }

  /**
   * Whether two colliders may touch; false excludes the pair from response and
   * overlap reports.
   */
  export type Filter = (
    a: AutoMovieXpbdCollider,
    b: AutoMovieXpbdCollider,
  ) => boolean;

  /**
   * Find the overlapping pairs at the predicted poses and their manifolds: each
   * responding pair contributes one contact per point of its patch
   * (`physicalShapeContactManifold`, features within `band` of the deepest
   * plane), or its nearest-feature witnesses when the patch is a single
   * crossing; a pair with a sensor contributes one overlap record.
   *
   * @param colliders Every collider, in creation order.
   * @param filter The pair filter.
   * @param band Depth below a support plane still counted as touching, metres.
   * @returns The contacts, in pair order; sensors included, flagged by their
   *   colliders.
   */
  export function detect(
    colliders: readonly AutoMovieXpbdCollider[],
    filter: Filter,
    band: number,
  ): IContact[] {
    const bounds: IAutoMoviePhysicalShapeBounds.IResult[] = colliders.map(
      (
        collider: AutoMovieXpbdCollider,
      ): IAutoMoviePhysicalShapeBounds.IResult => collider.bounds(),
    );
    const found: IContact[] = [];
    let pair: number = 0;
    for (let i: number = 0; i < colliders.length; i++)
      for (let j: number = i + 1; j < colliders.length; j++) {
        const a: AutoMovieXpbdCollider = colliders[i]!;
        const b: AutoMovieXpbdCollider = colliders[j]!;
        if (a.body === b.body || (!a.body.dynamic && !b.body.dynamic)) continue;
        const ba: IAutoMoviePhysicalShapeBounds.IResult = bounds[i]!;
        const bb: IAutoMoviePhysicalShapeBounds.IResult = bounds[j]!;
        if (
          ba.min.x > bb.max.x ||
          bb.min.x > ba.max.x ||
          ba.min.y > bb.max.y ||
          bb.min.y > ba.max.y ||
          ba.min.z > bb.max.z ||
          bb.min.z > ba.max.z ||
          !filter(a, b)
        )
          continue;
        const measured: physicalShapePairContact.IResult | null = measure(a, b);
        if (measured === null || !(measured.distance <= 0)) continue;
        const patch: physicalShapeContactManifold.IPoint[] =
          a.sensor || b.sensor
            ? []
            : physicalShapeContactManifold(
                a.bodyPose(),
                a.shape,
                b.bodyPose(),
                b.shape,
                measured.normal,
                band,
              );
        const points: physicalShapeContactManifold.IPoint[] = patch.length
          ? patch
          : [{ pointA: measured.pointA, pointB: measured.pointB }];
        for (const point of points) {
          const gap: number = Vector3.dot(
            Vector3.subtract(point.pointB, point.pointA),
            measured.normal,
          );
          const relative: IAutoMovieVector3 = Vector3.subtract(
            a.body.velocityAtPoint(point.pointA),
            b.body.velocityAtPoint(point.pointB),
          );
          found.push({
            a,
            b,
            pair,
            normal: measured.normal,
            localA: local(a.body, point.pointA),
            localB: local(b.body, point.pointB),
            friction: (a.friction + b.friction) / 2,
            restitution: (a.restitution + b.restitution) / 2,
            normalLambda: 0,
            tangentLambda: { x: 0, y: 0, z: 0 },
            tangentImpulse: 0,
            frictionImpulse: { x: 0, y: 0, z: 0 },
            approach: Vector3.dot(relative, measured.normal),
            separation: gap,
            detected: gap,
            velocityImpulse: 0,
          });
        }
        pair++;
      }
    return found;
  }
  /**
   * One position pass over the contacts.
   *
   * @param contacts The step's contacts; sensors are skipped.
   * @param h The substep, seconds.
   * @param allowed The depth left uncorrected, metres.
   * @param frequency The contact spring's natural frequency, hertz.
   */
  export function positions(
    contacts: readonly IContact[],
    h: number,
    allowed: number,
    frequency: number,
  ): void {
    const omega: number = 2 * Math.PI * frequency;
    for (const patch of manifolds(contacts)) {
      for (const contact of patch) {
        const first: AutoMovieXpbdBody = contact.a.body;
        const second: AutoMovieXpbdBody = contact.b.body;
        const armA: IAutoMovieVector3 = arm(first, contact.localA);
        const armB: IAutoMovieVector3 = arm(second, contact.localB);
        const depth: number = -Vector3.dot(
          Vector3.subtract(
            Vector3.add(second.center, armB),
            Vector3.add(first.center, armA),
          ),
          contact.normal,
        );
        contact.separation = -depth;
        if (!(depth > allowed)) continue;
        const away: IAutoMovieVector3 = Vector3.scale(contact.normal, -1);
        const weight: number =
          AutoMovieXpbdMath.weight(first, away, armA) +
          AutoMovieXpbdMath.weight(second, away, armB);
        contact.normalLambda += AutoMovieXpbdMath.positional(
          first,
          second,
          away,
          depth - allowed,
          armA,
          armB,
          weight / (omega * omega),
          h,
          contact.normalLambda,
        );
      }

      // Static friction acts on the patch as a whole, at its centroid with
      // the patch's normal multiplier (patch friction): it undoes the
      // centroid's tangential slip of the substep while the accumulated
      // tangential multiplier stays inside the cone mu * sum(lambda_n).
      const head: IContact = patch[0]!;
      const pressed: number = patch.reduce(
        (sum: number, contact: IContact): number => sum + contact.normalLambda,
        0,
      );
      if (!(pressed > 0)) continue;
      const first: AutoMovieXpbdBody = head.a.body;
      const second: AutoMovieXpbdBody = head.b.body;
      const localA: IAutoMovieVector3 = centroid(
        patch.map((contact: IContact): IAutoMovieVector3 => contact.localA),
      );
      const localB: IAutoMovieVector3 = centroid(
        patch.map((contact: IContact): IAutoMovieVector3 => contact.localB),
      );
      const armA: IAutoMovieVector3 = arm(first, localA);
      const armB: IAutoMovieVector3 = arm(second, localB);

      const slip: IAutoMovieVector3 = Vector3.subtract(
        Vector3.subtract(
          Vector3.add(first.center, armA),
          previous(first, localA),
        ),
        Vector3.subtract(
          Vector3.add(second.center, armB),
          previous(second, localB),
        ),
      );
      const tangent: IAutoMovieVector3 = Vector3.subtract(
        slip,
        Vector3.scale(head.normal, Vector3.dot(slip, head.normal)),
      );
      const length: number = Vector3.length(tangent);
      if (length > 0) {
        const back: IAutoMovieVector3 = {
          x: -tangent.x / length,
          y: -tangent.y / length,
          z: -tangent.z / length,
        };
        const total: number =
          AutoMovieXpbdMath.weight(first, back, armA) +
          AutoMovieXpbdMath.weight(second, back, armB);
        if (total > 0) {
          const wanted: IAutoMovieVector3 = Vector3.add(
            head.tangentLambda,
            Vector3.scale(back, length / total),
          );
          const bound: number = head.friction * pressed;
          const size: number = Vector3.length(wanted);
          const next: IAutoMovieVector3 =
            size > bound ? Vector3.scale(wanted, bound / size) : wanted;
          const step: IAutoMovieVector3 = Vector3.subtract(
            next,
            head.tangentLambda,
          );
          head.tangentLambda = next;
          AutoMovieXpbdMath.apply(first, second, step, armA, armB);
        }
      }
    }
  }
  /**
   * The velocity pass over the contacts that pressed this step.
   *
   * @param contacts The step's contacts.
   * @param h The substep, seconds.
   * @param gravity The world gravity's magnitude, metres per second squared.
   */
  export function velocities(
    contacts: readonly IContact[],
    h: number,
    gravity: number,
  ): void {
    for (const patch of manifolds(contacts)) {
      const pressedPoints: IContact[] = patch.filter(
        (contact: IContact): boolean => contact.normalLambda > 0,
      );
      if (pressedPoints.length === 0) continue;
      const head: IContact = patch[0]!;
      const first: AutoMovieXpbdBody = head.a.body;
      const second: AutoMovieXpbdBody = head.b.body;
      const pressed: number = pressedPoints.reduce(
        (sum: number, contact: IContact): number => sum + contact.normalLambda,
        0,
      );

      // Dynamic friction on the patch: an impulse against the centroid's
      // slip, at most what the cone mu * sum(lambda_n) leaves after the
      // positional friction, over h, and at most what stops the slip.
      const localA: IAutoMovieVector3 = centroid(
        pressedPoints.map(
          (contact: IContact): IAutoMovieVector3 => contact.localA,
        ),
      );
      const localB: IAutoMovieVector3 = centroid(
        pressedPoints.map(
          (contact: IContact): IAutoMovieVector3 => contact.localB,
        ),
      );
      const centreA: IAutoMovieVector3 = arm(first, localA);
      const centreB: IAutoMovieVector3 = arm(second, localB);
      const v: IAutoMovieVector3 = Vector3.subtract(
        first.velocityAtPoint(Vector3.add(first.center, centreA)),
        second.velocityAtPoint(Vector3.add(second.center, centreB)),
      );
      const vt: IAutoMovieVector3 = Vector3.subtract(
        v,
        Vector3.scale(head.normal, Vector3.dot(v, head.normal)),
      );
      const speed: number = Vector3.length(vt);
      if (speed > 0) {
        const direction: IAutoMovieVector3 = {
          x: -vt.x / speed,
          y: -vt.y / speed,
          z: -vt.z / speed,
        };
        const weight: number =
          AutoMovieXpbdMath.weight(first, direction, centreA) +
          AutoMovieXpbdMath.weight(second, direction, centreB);
        const amount: number = Math.min(
          (head.friction * pressed - Vector3.length(head.tangentLambda)) / h -
            head.tangentImpulse,
          speed / weight,
        );
        if (weight > 0 && amount > 0) {
          head.tangentImpulse += amount;
          head.frictionImpulse = Vector3.add(
            head.frictionImpulse,
            Vector3.scale(direction, amount),
          );
          AutoMovieXpbdMath.impulse(
            first,
            second,
            Vector3.scale(direction, amount),
            centreA,
            centreB,
          );
        }
      }

      // Each pressed point's normal velocity becomes the restitution of its
      // approach before the step, which also removes the velocity the
      // position correction left (Mueller et al. 2020, eq. 34).
      for (const contact of pressedPoints) {
        const armA: IAutoMovieVector3 = arm(first, contact.localA);
        const armB: IAutoMovieVector3 = arm(second, contact.localB);
        const bounce: number =
          contact.approach > 2 * gravity * h
            ? contact.restitution * contact.approach
            : 0;
        const after: IAutoMovieVector3 = Vector3.subtract(
          first.velocityAtPoint(Vector3.add(first.center, armA)),
          second.velocityAtPoint(Vector3.add(second.center, armB)),
        );
        const away: IAutoMovieVector3 = Vector3.scale(contact.normal, -1);
        const normalWeight: number =
          AutoMovieXpbdMath.weight(first, away, armA) +
          AutoMovieXpbdMath.weight(second, away, armB);
        if (!(normalWeight > 0)) continue;
        // A contact only pushes: over the substep its position and velocity
        // impulses together stay nonnegative (Signorini), so the pass may
        // take back at most what the position pass gave.
        const push: number = Math.max(
          (bounce + Vector3.dot(after, contact.normal)) / normalWeight,
          -(contact.normalLambda / h + contact.velocityImpulse),
        );
        contact.velocityImpulse += push;
        AutoMovieXpbdMath.impulse(
          first,
          second,
          Vector3.scale(away, push),
          armA,
          armB,
        );
      }
    }
  }

  /**
   * The responding contacts grouped by collider pair, in pair order; sensors
   * are left out.
   *
   * @param contacts The step's contacts, the points of one pair adjacent.
   * @returns One array per pair; the contacts are the given records.
   */
  export function manifolds(contacts: readonly IContact[]): IContact[][] {
    const result: IContact[][] = [];
    for (const contact of contacts) {
      if (contact.a.sensor || contact.b.sensor) continue;
      const last: IContact[] | undefined = result[result.length - 1];
      if (last !== undefined && last[0]!.pair === contact.pair)
        last.push(contact);
      else result.push([contact]);
    }
    return result;
  }

  /** The mean of body-frame offsets. */
  function centroid(points: readonly IAutoMovieVector3[]): IAutoMovieVector3 {
    return Vector3.scale(
      points.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / points.length,
    );
  }
  /**
   * The contact of two colliders, or null when they are apart. Two polytopes
   * (boxes and hulls) are tested by GJK and, when they overlap, measured by EPA
   * (physicalShapePenetration), which is exact for polytopes; a pair with a
   * round shape takes its exact wire distance (physicalShapePairContact), whose
   * round wire is one segment.
   */
  function measure(
    a: AutoMovieXpbdCollider,
    b: AutoMovieXpbdCollider,
  ): physicalShapePairContact.IResult | null {
    const round = (collider: AutoMovieXpbdCollider): boolean =>
      collider.shape.kind === "sphere" || collider.shape.kind === "capsule";
    if (round(a) || round(b))
      return physicalShapePairContact(
        a.bodyPose(),
        a.shape,
        b.bodyPose(),
        b.shape,
      );
    const deep: physicalShapePenetration.IResult | null =
      physicalShapePenetration(a.bodyPose(), a.shape, b.bodyPose(), b.shape);
    return deep === null
      ? null
      : {
          distance: -deep.depth,
          normal: deep.normal,
          pointA: deep.pointA,
          pointB: deep.pointB,
        };
  }

  /** A world witness as a body-frame offset from the centre. */
  function local(
    body: AutoMovieXpbdBody,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(body.orientation),
      Vector3.subtract(point, body.center),
    );
  }

  /** A body-frame offset from the centre as a world arm. */
  function arm(
    body: AutoMovieXpbdBody,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(body.orientation, offset);
  }

  /** Where a body-frame offset was at the start of the step. */
  function previous(
    body: AutoMovieXpbdBody,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const rotation: IAutoMovieQuaternion = body.previousOrientation;
    return Vector3.add(
      body.previousCenter,
      Quaternion.rotateVector(rotation, offset),
    );
  }
}
