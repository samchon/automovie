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

/**
 * The contact phase of one extended position-based dynamics step (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, section 3.5 and 3.6).
 *
 * `detect` finds the overlapping collider pairs at the step's predicted
 * poses and keeps each one's witnesses in its bodies' frames. `positions`
 * resolves each contact's depth beyond the allowed error along its fixed
 * normal, as a compliant constraint whose stiffness is a spring of the
 * world's contact frequency on the pair's effective mass (Macklin, Mueller
 * and Chentanez 2016: compliance `alpha = 1 / k`), and removes its tangential slip up to the friction cone
 * `lambda_t <= mu lambda_n`, each point taking the share its own normal
 * multiplier allows. `velocities`, one Gauss-Seidel sweep over the points that the world
 * repeats as often as the position passes, applies dynamic friction, an
 * impulse against the slip of at most what the cone leaves over all
 * sweeps, `(mu lambda_n - lambda_t) / h`, and at most what stops the slip, then sets the normal velocity to the restitution of the pre-step approach when that approach is faster than gravity gives in two substeps, and to rest otherwise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three phases, the depth beyond the allowed error, the compliance, both frictions and the restitution threshold.
 * @evidence contracts/development/design.md#principled-representation A namespace over the world's colliders with each contact's witnesses in body frames and its multipliers in newton seconds squared.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `AutoMovieXpbdWorld.step` drives the three phases; the contacts it returns are what the simulation's receipts read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coefficients are the colliders' and the world's; nothing is tuned here.
 */
export namespace solveXpbdContacts {
  /**
   * One contact of a step: the pair, its normal and witnesses, and its multipliers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pair, its normal, witnesses, materials and multipliers.
   * @evidence contracts/development/design.md#principled-representation Body-frame witnesses in metres, multipliers in newton seconds squared, impulses in newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Created by detect and read by the position and velocity passes and the world's manifolds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Witnesses are stored in body frames so the passes read them at the current poses.
   */
  export interface IContact {
    /** The first collider. */
    a: AutoMovieXpbdCollider;

    /** The second collider. */
    b: AutoMovieXpbdCollider;

    /** Index of the collider pair among the step's touching pairs; the points of one manifold share it. */
    pair: number;

    /** Unit world normal from the first collider toward the second, fixed for the step. */
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

    /** Tangential multiplier vector accumulated this step, newton seconds squared. */
    tangentLambda: IAutoMovieVector3;

    /** Dynamic friction impulse accumulated over this step's velocity passes, newton seconds. */
    tangentImpulse: number;

    /** Normal approach speed at detection, metres per second; positive closing. */
    approach: number;

    /** Signed distance at the end of the step, metres. */
    separation: number;

    /** Signed distance where the step found the contact, before any correction, metres. */
    detected: number;

    /** Normal impulse of the velocity passes, newton seconds; positive pushing the pair apart. */
    velocityImpulse: number;
  }

  /**
   * Whether two colliders may touch; false excludes the pair from response and overlap reports.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a false answer excludes.
   * @evidence contracts/development/design.md#principled-representation A predicate over two colliders.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by the physical simulation's self-exclusions and consulted by detect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One predicate serves contact response and sensor overlaps.
   */
  export type Filter = (
    a: AutoMovieXpbdCollider,
    b: AutoMovieXpbdCollider,
  ) => boolean;

  /**
   * Find the overlapping pairs at the predicted poses and their manifolds:
   * each responding pair contributes one contact per point of its patch
   * (`physicalShapeContactManifold`, features within `band` of the deepest
   * plane), or its nearest-feature witnesses when the patch is a single
   * crossing; a pair with a sensor contributes one overlap record.
   *
   * @param colliders Every collider, in creation order.
   * @param filter The pair filter.
   * @param band Depth below a support plane still counted as touching, metres.
   * @returns The contacts, in pair order; sensors included, flagged by their colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bounds test, the filter, the manifold and the sensor case.
   * @evidence contracts/development/implementation.md#principled-implementation Bounding boxes prune pairs; physicalShapePairContact gives depth and normal; physicalShapeContactManifold gives the patch points (Ericson 2005; Gregorius 2015).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair loop delegating geometry to its owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every pair passing the bounds and the filter is measured exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in colliders for the bounds test, one exact query per overlapping pair.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each step's predicted poses differ, so nothing carries over.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh contacts; retains nothing.
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
        const measured: physicalShapePairContact.IResult =
          physicalShapePairContact(
            a.bodyPose(),
            a.shape,
            b.bodyPose(),
            b.shape,
          );
        if (!(measured.distance < 0)) continue;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the compliant depth correction and the friction projection.
   * @evidence contracts/development/implementation.md#principled-implementation Macklin et al. 2016 compliance alpha = w / omega^2 on depth beyond the allowed error; static friction as a Coulomb projection of the accumulated tangential multiplier onto mu lambda_n.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the contacts: normal, then tangential.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sensors are skipped; coefficients are the contact's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in contacts per pass.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Multipliers accumulate on the contacts for the step only.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the bodies it is given; allocates only transient vectors.
   */
  export function positions(
    contacts: readonly IContact[],
    h: number,
    allowed: number,
    frequency: number,
  ): void {
    const omega: number = 2 * Math.PI * frequency;
    for (const contact of contacts) {
      if (contact.a.sensor || contact.b.sensor) continue;
      const first: AutoMovieXpbdBody = contact.a.body;
      const second: AutoMovieXpbdBody = contact.b.body;
      const armA: IAutoMovieVector3 = arm(first, contact.localA);
      const armB: IAutoMovieVector3 = arm(second, contact.localB);
      const pa: IAutoMovieVector3 = Vector3.add(first.center, armA);
      const pb: IAutoMovieVector3 = Vector3.add(second.center, armB);
      const depth: number = -Vector3.dot(
        Vector3.subtract(pb, pa),
        contact.normal,
      );
      contact.separation = -depth;
      if (!(depth > allowed)) continue;
      const away: IAutoMovieVector3 = Vector3.scale(contact.normal, -1);
      const weight: number =
        AutoMovieXpbdMath.weight(first, away, armA) +
        AutoMovieXpbdMath.weight(second, away, armB);
      const alpha: number = weight / (omega * omega);
      contact.normalLambda += AutoMovieXpbdMath.positional(
        first,
        second,
        away,
        depth - allowed,
        armA,
        armB,
        alpha,
        h,
        contact.normalLambda,
      );

      // Static friction: undo this step's tangential slip of the witnesses
      // while the tangential multiplier stays inside the friction cone.
      const slip: IAutoMovieVector3 = Vector3.subtract(
        Vector3.subtract(pa, previous(first, contact.localA)),
        Vector3.subtract(pb, previous(second, contact.localB)),
      );
      const tangent: IAutoMovieVector3 = Vector3.subtract(
        slip,
        Vector3.scale(contact.normal, Vector3.dot(slip, contact.normal)),
      );
      const length: number = Vector3.length(tangent);
      if (!(length > 0)) continue;
      const back: IAutoMovieVector3 = {
        x: -tangent.x / length,
        y: -tangent.y / length,
        z: -tangent.z / length,
      };
      const total: number =
        AutoMovieXpbdMath.weight(first, back, armA) +
        AutoMovieXpbdMath.weight(second, back, armB);
      if (!(total > 0)) continue;
      // The accumulated tangential multiplier is projected back onto the
      // cone, so corrections that cancel across passes spend no budget.
      const wanted: IAutoMovieVector3 = Vector3.add(
        contact.tangentLambda,
        Vector3.scale(back, length / total),
      );
      const bound: number = contact.friction * contact.normalLambda;
      const size: number = Vector3.length(wanted);
      const next: IAutoMovieVector3 =
        size > bound ? Vector3.scale(wanted, bound / size) : wanted;
      const step: IAutoMovieVector3 = Vector3.subtract(
        next,
        contact.tangentLambda,
      );
      contact.tangentLambda = next;
      AutoMovieXpbdMath.apply(first, second, step, armA, armB);
    }
  }
  /**
   * The velocity pass over the contacts that pressed this step.
   *
   * @param contacts The step's contacts.
   * @param h The substep, seconds.
   * @param gravity The world gravity's magnitude, metres per second squared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States dynamic friction's budget and the restitution rule.
   * @evidence contracts/development/implementation.md#principled-implementation Mueller et al. 2020, sec. 3.6: dynamic friction bounded by the cone's remaining impulse, then the normal velocity set to the restitution of the pre-step approach above 2 g h.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Friction then normal, each with its own generalized inverse mass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only pressing contacts are treated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in contacts per sweep.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The friction budget accumulates on the contacts for the step only.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the bodies it is given; allocates only transient vectors.
   */
  export function velocities(
    contacts: readonly IContact[],
    h: number,
    gravity: number,
  ): void {
    for (const contact of contacts) {
      if (contact.a.sensor || contact.b.sensor || !(contact.normalLambda > 0))
        continue;
      const first: AutoMovieXpbdBody = contact.a.body;
      const second: AutoMovieXpbdBody = contact.b.body;
      const armA: IAutoMovieVector3 = arm(first, contact.localA);
      const armB: IAutoMovieVector3 = arm(second, contact.localB);
      const v: IAutoMovieVector3 = Vector3.subtract(
        first.velocityAtPoint(Vector3.add(first.center, armA)),
        second.velocityAtPoint(Vector3.add(second.center, armB)),
      );
      const vn: number = Vector3.dot(v, contact.normal);
      const vt: IAutoMovieVector3 = Vector3.subtract(
        v,
        Vector3.scale(contact.normal, vn),
      );
      const speed: number = Vector3.length(vt);

      // Dynamic friction: an impulse against the slip, at most what the
      // cone mu lambda_n leaves after the positional friction, over h, and
      // at most what stops the slip.
      if (speed > 0) {
        const direction: IAutoMovieVector3 = {
          x: -vt.x / speed,
          y: -vt.y / speed,
          z: -vt.z / speed,
        };
        const weight: number =
          AutoMovieXpbdMath.weight(first, direction, armA) +
          AutoMovieXpbdMath.weight(second, direction, armB);
        const amount: number = Math.min(
          (contact.friction * contact.normalLambda -
            Vector3.length(contact.tangentLambda)) /
            h -
            contact.tangentImpulse,
          speed / weight,
        );
        if (weight > 0 && amount > 0) {
          contact.tangentImpulse += amount;
          AutoMovieXpbdMath.impulse(
            first,
            second,
            Vector3.scale(direction, amount),
            armA,
            armB,
          );
        }
      }

      // The normal velocity becomes the restitution of the approach before
      // the step, which also removes the velocity the position correction
      // left (Mueller et al. 2020, eq. 34).
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
      if (normalWeight > 0) {
        const push: number =
          (bounce + Vector3.dot(after, contact.normal)) / normalWeight;
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
