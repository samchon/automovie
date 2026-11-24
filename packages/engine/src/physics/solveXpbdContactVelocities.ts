import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import { solveXpbdContacts } from "./solveXpbdContacts";

/**
 * The velocity pass over the contacts that pressed this step (Mueller, Macklin,
 * Chentanez, Jeschke and Kim 2020, section 3.6): dynamic friction on each
 * patch, at most what the cone leaves after the positional friction, and each
 * pressed point's normal velocity set to the restitution of its approach.
 *
 * @param contacts The step's contacts.
 * @param h The substep, seconds.
 * @param gravity The world gravity's magnitude, metres per second squared.
 */
export function solveXpbdContactVelocities(
  contacts: readonly solveXpbdContacts.IContact[],
  h: number,
  gravity: number,
): void {
  for (const patch of solveXpbdContacts.manifolds(contacts)) {
    const pressedPoints: solveXpbdContacts.IContact[] = patch.filter(
      (contact: solveXpbdContacts.IContact): boolean =>
        contact.normalLambda > 0,
    );
    if (pressedPoints.length === 0) continue;
    const head: solveXpbdContacts.IContact = patch[0]!;
    const first: AutoMovieXpbdBody = head.a.body;
    const second: AutoMovieXpbdBody = head.b.body;
    const pressed: number = pressedPoints.reduce(
      (sum: number, contact: solveXpbdContacts.IContact): number =>
        sum + contact.normalLambda,
      0,
    );

    // Dynamic friction on the patch: an impulse against the centroid's
    // slip, at most what the cone mu * sum(lambda_n) leaves after the
    // positional friction, over h, and at most what stops the slip.
    const localA: IAutoMovieVector3 = solveXpbdContacts.centroid(
      pressedPoints.map(
        (contact: solveXpbdContacts.IContact): IAutoMovieVector3 =>
          contact.localA,
      ),
    );
    const localB: IAutoMovieVector3 = solveXpbdContacts.centroid(
      pressedPoints.map(
        (contact: solveXpbdContacts.IContact): IAutoMovieVector3 =>
          contact.localB,
      ),
    );
    const centreA: IAutoMovieVector3 = solveXpbdContacts.arm(first, localA);
    const centreB: IAutoMovieVector3 = solveXpbdContacts.arm(second, localB);
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
      const armA: IAutoMovieVector3 = solveXpbdContacts.arm(
        first,
        contact.localA,
      );
      const armB: IAutoMovieVector3 = solveXpbdContacts.arm(
        second,
        contact.localB,
      );
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
