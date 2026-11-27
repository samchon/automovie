import type { AutoMovieEnginePhysicsContactTypes } from "../AutoMovieEnginePhysicsContactTypes";
import type {
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePhysicalShapePairContact,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import type { AutoMovieEngineXpbdCollider } from "../AutoMovieEngineXpbdCollider";
import { AutoMovieEngineXpbdMath } from "../AutoMovieEngineXpbdMath";
import type { IAutoMovieXpbdContactRow } from "./IAutoMovieXpbdContactRow";
import type { IAutoMovieXpbdResponder } from "./IAutoMovieXpbdResponder";
import { correctXpbdContactRow } from "./correctXpbdContactRow";
import { pairXpbdContactRow } from "./pairXpbdContactRow";
import { physicalShapeContactManifold } from "./physicalShapeContactManifold";
import { physicalShapePairContact } from "./physicalShapePairContact";
import { physicalShapePenetration } from "./physicalShapePenetration";

/*
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
 * normal multiplier allows. `solveXpbdContactVelocities`, one Gauss-Seidel
 * sweep over the points that the world repeats as often as the position passes,
 * applies dynamic friction, an impulse against the slip of at most what the
 * cone leaves over all sweeps, `(mu lambda_n - lambda_t) / h`, and at most what
 * stops the slip, then sets the normal velocity to the restitution of the
 * pre-step approach when that approach is faster than gravity gives in two
 * substeps, and to rest otherwise.
 */
export namespace solveXpbdContacts {
  /*
   * One contact of a step: the pair, its normal and witnesses, and its
   * multipliers.
   */
  export interface IContact {
    /*
     * The first collider.
     */
    a: AutoMovieEngineXpbdCollider;

    /*
     * The second collider.
     */
    b: AutoMovieEngineXpbdCollider;

    /*
     * Index of the collider pair among the step's touching pairs; the points of
     * one manifold share it.
     */
    pair: number;

    /*
     * Unit world normal from the first collider toward the second, fixed for
     * the step.
     */
    normal: IAutoMovieVector3;

    /*
     * The first witness in the first body's frame, from its centre, metres.
     */
    localA: IAutoMovieVector3;

    /*
     * The second witness in the second body's frame, from its centre, metres.
     */
    localB: IAutoMovieVector3;

    /*
     * Combined Coulomb friction coefficient.
     */
    friction: number;

    /*
     * Combined restitution coefficient.
     */
    restitution: number;

    /*
     * Normal multiplier accumulated this step, newton seconds squared.
     */
    normalLambda: number;

    /*
     * Tangential multiplier vector accumulated this step, newton seconds
     * squared.
     */
    tangentLambda: IAutoMovieVector3;
    /*
     * Dynamic friction impulse accumulated over this step's velocity passes,
     * newton seconds.
     */
    tangentImpulse: number;

    /*
     * The same dynamic friction as a vector, the impulse the first body
     * received, newton seconds.
     */
    frictionImpulse: IAutoMovieVector3;

    /*
     * Normal approach speed at detection, metres per second; positive closing.
     */
    approach: number;

    /*
     * Signed distance at the end of the step, metres.
     */
    separation: number;

    /*
     * Signed distance where the step found the contact, before any correction,
     * metres.
     */
    detected: number;

    /*
     * Normal impulse of the velocity passes, newton seconds; positive pushing
     * the pair apart.
     */
    velocityImpulse: number;
  }

  /*
   * Whether two colliders may touch; false excludes the pair from response and
   * overlap reports.
   */
  export type Filter = (
    a: AutoMovieEngineXpbdCollider,
    b: AutoMovieEngineXpbdCollider,
  ) => boolean;

  /*
   * Find the overlapping pairs at the predicted poses and their manifolds: each
   * responding pair contributes one contact per point of its patch
   * (`physicalShapeContactManifold`, features within `band` of the deepest
   * plane), or its nearest-feature witnesses when the patch is a single
   * crossing; a pair with a sensor contributes one overlap record.
   * Parameter colliders: Every collider, in creation order.
   * Parameter filter: The pair filter.
   * Parameter band: Depth below a support plane still counted as touching, metres.
   * Returns: The contacts, in pair order; sensors included, flagged by their
   * colliders.
   */
  export function detect(
    colliders: readonly AutoMovieEngineXpbdCollider[],
    filter: Filter,
    band: number,
  ): IContact[] {
    const bounds: IAutoMoviePhysicalShapeBounds.IResult[] = colliders.map(
      (
        collider: AutoMovieEngineXpbdCollider,
      ): IAutoMoviePhysicalShapeBounds.IResult => collider.bounds(),
    );
    const found: IContact[] = [];
    let pair: number = 0;
    for (let i: number = 0; i < colliders.length; i++)
      for (let j: number = i + 1; j < colliders.length; j++) {
        const a: AutoMovieEngineXpbdCollider = colliders[i]!;
        const b: AutoMovieEngineXpbdCollider = colliders[j]!;
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
        const measured: IAutoMoviePhysicalShapePairContact | null = measure(a, b);
        if (measured === null || !(measured.distance <= 0)) continue;
        const patch: AutoMovieEnginePhysicsContactTypes.IPoint[] =
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
        const points: AutoMovieEnginePhysicsContactTypes.IPoint[] = patch.length
          ? patch
          : [{ pointA: measured.pointA, pointB: measured.pointB }];
        for (const point of points) {
          const gap: number = AutoMovieEngineVector3.dot(
            AutoMovieEngineVector3.subtract(point.pointB, point.pointA),
            measured.normal,
          );
          const relative: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
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
            approach: AutoMovieEngineVector3.dot(relative, measured.normal),
            separation: gap,
            detected: gap,
            velocityImpulse: 0,
          });
        }
        pair++;
      }
    return found;
  }
  /*
   * One position pass over the contacts.
   * Parameter contacts: The step's contacts; sensors are skipped.
   * Parameter h: The substep, seconds.
   * Parameter allowed: The depth left uncorrected, metres.
   * Parameter frequency: The contact spring's natural frequency, hertz.
   * Parameter trees: The pass's articulated response (`respondXpbdArticulation`): a
   * jointed body's correction moves its whole tree along its joints' free
   * axes; each body alone when absent.
   */
  export function positions(
    contacts: readonly IContact[],
    h: number,
    allowed: number,
    frequency: number,
    trees?: IAutoMovieXpbdResponder,
  ): void {
    const omega: number = 2 * Math.PI * frequency;
    for (const patch of manifolds(contacts)) {
      for (const contact of patch) {
        const first: AutoMovieEngineXpbdBody = contact.a.body;
        const second: AutoMovieEngineXpbdBody = contact.b.body;
        const armA: IAutoMovieVector3 = arm(first, contact.localA);
        const armB: IAutoMovieVector3 = arm(second, contact.localB);
        const depth: number = -AutoMovieEngineVector3.dot(
          AutoMovieEngineVector3.subtract(
            AutoMovieEngineVector3.add(second.center, armB),
            AutoMovieEngineVector3.add(first.center, armA),
          ),
          contact.normal,
        );
        contact.separation = -depth;
        if (!(depth > allowed)) continue;
        const away: IAutoMovieVector3 = AutoMovieEngineVector3.scale(contact.normal, -1);
        contact.normalLambda += correctXpbdContactRow(
          trees,
          first,
          second,
          away,
          depth - allowed,
          armA,
          armB,
          omega,
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
      const first: AutoMovieEngineXpbdBody = head.a.body;
      const second: AutoMovieEngineXpbdBody = head.b.body;
      const localA: IAutoMovieVector3 = centroid(
        patch.map((contact: IContact): IAutoMovieVector3 => contact.localA),
      );
      const localB: IAutoMovieVector3 = centroid(
        patch.map((contact: IContact): IAutoMovieVector3 => contact.localB),
      );
      const armA: IAutoMovieVector3 = arm(first, localA);
      const armB: IAutoMovieVector3 = arm(second, localB);

      const slip: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.subtract(
          AutoMovieEngineVector3.add(first.center, armA),
          previous(first, localA),
        ),
        AutoMovieEngineVector3.subtract(
          AutoMovieEngineVector3.add(second.center, armB),
          previous(second, localB),
        ),
      );
      const tangent: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        slip,
        AutoMovieEngineVector3.scale(head.normal, AutoMovieEngineVector3.dot(slip, head.normal)),
      );
      const length: number = AutoMovieEngineVector3.length(tangent);
      if (length > 0) {
        const back: IAutoMovieVector3 = {
          x: -tangent.x / length,
          y: -tangent.y / length,
          z: -tangent.z / length,
        };
        for (;;) {
          const along: IAutoMovieXpbdContactRow = pairXpbdContactRow(
            trees,
            first,
            second,
            back,
            armA,
            armB,
          );
          if (!(along.weight > 0)) break;
          const wanted: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            head.tangentLambda,
            AutoMovieEngineVector3.scale(back, length / along.weight),
          );
          const bound: number = head.friction * pressed;
          const size: number = AutoMovieEngineVector3.length(wanted);
          const next: IAutoMovieVector3 =
            size > bound ? AutoMovieEngineVector3.scale(wanted, bound / size) : wanted;
          const step: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
            next,
            head.tangentLambda,
          );
          // The step along the slip moves the pair as the slip's own row; a
          // part of it off the slip (the cone's projection keeps it along
          // `back` here) moves them rigidly, as before.
          const amount: number = AutoMovieEngineVector3.dot(step, back);
          if (along.limit(amount)) continue;
          head.tangentLambda = next;
          along.apply(amount);
          const rest: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
            step,
            back,
            -amount,
          );
          if (AutoMovieEngineVector3.length(rest) > 0)
            AutoMovieEngineXpbdMath.apply(first, second, rest, armA, armB);
          break;
        }
      }
    }
  }
  /*
   * The responding contacts grouped by collider pair, in pair order; sensors
   * are left out.
   * Parameter contacts: The step's contacts, the points of one pair adjacent.
   * Returns: One array per pair; the contacts are the given records.
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

  /*
   * The mean of body-frame offsets.
   * Parameter points: The offsets, at least one.
   * Returns: Their mean.
   */
  export function centroid(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.scale(
      points.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / points.length,
    );
  }
  /*
   * A body-frame offset from the centre as a world arm.
   * Parameter body: The body.
   * Parameter offset: The offset in its frame, metres.
   * Returns: The world arm, metres.
   */
  export function arm(
    body: AutoMovieEngineXpbdBody,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(body.orientation, offset);
  }

  /*
   * The contact of two colliders, or null when they are apart. Two polytopes
   * (boxes and hulls) are tested by GJK and, when they overlap, measured by EPA
   * (physicalShapePenetration), which is exact for polytopes; a pair with a
   * round shape takes its exact wire distance (physicalShapePairContact), whose
   * round wire is one segment.
   */
  function measure(
    a: AutoMovieEngineXpbdCollider,
    b: AutoMovieEngineXpbdCollider,
  ): IAutoMoviePhysicalShapePairContact | null {
    const round = (collider: AutoMovieEngineXpbdCollider): boolean =>
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

  /*
   * A world witness as a body-frame offset from the centre.
   */
  function local(
    body: AutoMovieEngineXpbdBody,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(body.orientation),
      AutoMovieEngineVector3.subtract(point, body.center),
    );
  }

  /*
   * Where a body-frame offset was at the start of the step.
   */
  function previous(
    body: AutoMovieEngineXpbdBody,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const rotation: IAutoMovieQuaternion = body.previousOrientation;
    return AutoMovieEngineVector3.add(
      body.previousCenter,
      AutoMovieEngineQuaternion.rotateVector(rotation, offset),
    );
  }
}
