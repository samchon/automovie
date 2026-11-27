import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import { AutoMovieEngineXpbdMath } from "../AutoMovieEngineXpbdMath";
import { AutoMovieEngineXpbdWorld } from "../AutoMovieEngineXpbdWorld";

/*
 * The velocity pass over the contacts that pressed this step (Mueller, Macklin,
 * Chentanez, Jeschke and Kim 2020, section 3.6): dynamic friction on each
 * patch, at most what the cone leaves after the positional friction, and each
 * pressed point's normal velocity set to the restitution of its approach.
 * Parameter contacts: The step's contacts.
 * Parameter h: The substep, seconds.
 * Parameter gravity: The world gravity's magnitude, metres per second squared.
 */
export function solveXpbdContactVelocities(
  contacts: readonly AutoMovieEngineXpbdWorld.IContact[],
  h: number,
  gravity: number,
): void {
  for (const patch of AutoMovieEngineXpbdWorld.manifolds(contacts)) {
    const pressedPoints: AutoMovieEngineXpbdWorld.IContact[] = patch.filter(
      (contact: AutoMovieEngineXpbdWorld.IContact): boolean =>
        contact.normalLambda > 0,
    );
    if (pressedPoints.length === 0) continue;
    const head: AutoMovieEngineXpbdWorld.IContact = patch[0]!;
    const first: AutoMovieEngineXpbdBody = head.a.body;
    const second: AutoMovieEngineXpbdBody = head.b.body;
    const pressed: number = pressedPoints.reduce(
      (sum: number, contact: AutoMovieEngineXpbdWorld.IContact): number =>
        sum + contact.normalLambda,
      0,
    );

    // Dynamic friction on the patch: an impulse against the centroid's
    // slip, at most what the cone mu * sum(lambda_n) leaves after the
    // positional friction, over h, and at most what stops the slip.
    const localA: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.centroid(
      pressedPoints.map(
        (contact: AutoMovieEngineXpbdWorld.IContact): IAutoMovieVector3 =>
          contact.localA,
      ),
    );
    const localB: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.centroid(
      pressedPoints.map(
        (contact: AutoMovieEngineXpbdWorld.IContact): IAutoMovieVector3 =>
          contact.localB,
      ),
    );
    const centreA: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.arm(first, localA);
    const centreB: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.arm(second, localB);
    const v: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      first.velocityAtPoint(AutoMovieEngineVector3.add(first.center, centreA)),
      second.velocityAtPoint(AutoMovieEngineVector3.add(second.center, centreB)),
    );
    const vt: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      v,
      AutoMovieEngineVector3.scale(head.normal, AutoMovieEngineVector3.dot(v, head.normal)),
    );
    const speed: number = AutoMovieEngineVector3.length(vt);
    if (speed > 0) {
      const direction: IAutoMovieVector3 = {
        x: -vt.x / speed,
        y: -vt.y / speed,
        z: -vt.z / speed,
      };
      const weight: number =
        AutoMovieEngineXpbdMath.weight(first, direction, centreA) +
        AutoMovieEngineXpbdMath.weight(second, direction, centreB);
      const amount: number = Math.min(
        (head.friction * pressed - AutoMovieEngineVector3.length(head.tangentLambda)) / h -
          head.tangentImpulse,
        speed / weight,
      );
      if (weight > 0 && amount > 0) {
        head.tangentImpulse += amount;
        head.frictionImpulse = AutoMovieEngineVector3.add(
          head.frictionImpulse,
          AutoMovieEngineVector3.scale(direction, amount),
        );
        AutoMovieEngineXpbdMath.impulse(
          first,
          second,
          AutoMovieEngineVector3.scale(direction, amount),
          centreA,
          centreB,
        );
      }
    }

    // Each pressed point's normal velocity becomes the restitution of its
    // approach before the step, which also removes the velocity the
    // position correction left (Mueller et al. 2020, eq. 34).
    for (const contact of pressedPoints) {
      const armA: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.arm(
        first,
        contact.localA,
      );
      const armB: IAutoMovieVector3 = AutoMovieEngineXpbdWorld.arm(
        second,
        contact.localB,
      );
      const bounce: number =
        contact.approach > 2 * gravity * h
          ? contact.restitution * contact.approach
          : 0;
      const after: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        first.velocityAtPoint(AutoMovieEngineVector3.add(first.center, armA)),
        second.velocityAtPoint(AutoMovieEngineVector3.add(second.center, armB)),
      );
      const away: IAutoMovieVector3 = AutoMovieEngineVector3.scale(contact.normal, -1);
      const normalWeight: number =
        AutoMovieEngineXpbdMath.weight(first, away, armA) +
        AutoMovieEngineXpbdMath.weight(second, away, armB);
      if (!(normalWeight > 0)) continue;
      // A contact only pushes: over the substep its position and velocity
      // impulses together stay nonnegative (Signorini), so the pass may
      // take back at most what the position pass gave.
      const push: number = Math.max(
        (bounce + AutoMovieEngineVector3.dot(after, contact.normal)) / normalWeight,
        -(contact.normalLambda / h + contact.velocityImpulse),
      );
      contact.velocityImpulse += push;
      AutoMovieEngineXpbdMath.impulse(
        first,
        second,
        AutoMovieEngineVector3.scale(away, push),
        armA,
        armB,
      );
    }
  }
}
