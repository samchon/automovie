import {
  projectileAt,
  projectileContinue,
  projectileFirstContact,
  resolveAutoMovieContactEvents,
} from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileFirstContact,
  IAutoMovieResolveContactEvents,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/**
 * How far a quadratic-drag return may stand from its closed form, seconds: the
 * flight is integrated at the engine's fixed step, whose fourth-order error
 * over a second of strong drag stays under a millisecond.
 */
const DRAG_RETURN: number = 1e-3;

import { nclose } from "../../../internal/nclose";

/**
 * Resolved plane contact departs without a clock nudge and may meet again.
 *
 * Default overlap, stationary/approaching motion, an unrelated id and an opaque
 * moving collider still report the initial contact. The opt-in plane query
 * distinguishes outward/accelerating motion, a fixed tail and an unsupported
 * rotating tail. A single scan step spanning a whole parabola finds its
 * positive reentry at 2v/g; a wall before the clearance witness keeps its own
 * time in either collider order. A real 24-bisection impact feeds continuation,
 * carrying its unprojected origin into the next query.
 *
 * Drag-free times use the existing contact accuracy of 1e-5 s. A vertical
 * quadratic-drag return uses its closed-form atan/acosh time and the flight
 * acceptance of 1 ms (#3470), independently of the integrated reader. Invalid
 * model certificates must throw rather than suppress a contact.
 *
 * Scenarios:
 *
 * 1. Raw, unresolved, stationary, approaching and unrelated-id contacts stay at
 *    zero; resolved outgoing and outward-accelerating planes depart.
 * 2. Fixed-tail departure is supported; rotating-tail contact stays visible.
 * 3. A whole-parabola step finds reentry at 2v/g, while other colliders keep their
 *    initial or distance/speed contact in either input order.
 * 4. A real impact's carried position departs after continuation; quadratic drag
 *    returns at the independent vertical-flight closed-form time.
 * 5. An opaque moving collider has no inferred departure, and malformed
 *    shared-resolver clearance certificates throw.
 * 6. A box in a fixed frame departs by its supporting plane and is met again at
 *    2v/g; the same box read through an opaque pose keeps the contact.
 */
export function test_unit_engine_physics_projectile_first_contact_departure(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const ground: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.plane("ground", zero, up);
  const outgoing: IAutoMovieProjectile = {
    origin: zero,
    velocity: up,
    gravity: zero,
  };
  const options: IAutoMovieProjectileFirstContact.IOptions = {
    radius: 0,
    thickness: Number.MAX_VALUE,
    departing: ground.id,
  };
  const span: { from: number; to: number } = { from: 0, to: 2 };
  const findings: string[] = [];

  /** Preserve all case findings for the same verification round. */
  const check: (label: string, predicate: boolean) => void = (
    label: string,
    predicate: boolean,
  ): void => {
    if (!predicate) findings.push(label);
  };
  /** An unexpected exception is a failure, while independent cases continue. */
  const observe: (label: string, read: () => void) => void = (
    label: string,
    read: () => void,
  ): void => {
    try {
      read();
    } catch (error) {
      findings.push(`${label}: ${String(error)}`);
    }
  };

  observe("initial policy", (): void => {
    const raw: IAutoMovieHit | null = projectileFirstContact(
      outgoing,
      [ground],
      span,
      { radius: 0, thickness: options.thickness },
    );
    check("raw touch remains at zero", raw?.time === 0);
    check(
      "resolved outward flight leaves the floor",
      projectileFirstContact(outgoing, [ground], span, options) === null,
    );
    check(
      "accelerating away leaves the floor",
      projectileFirstContact(
        { ...outgoing, velocity: zero, gravity: up },
        [ground],
        span,
        options,
      ) === null,
    );
    for (const speed of [0, -1]) {
      const hit: IAutoMovieHit | null = projectileFirstContact(
        { ...outgoing, velocity: { x: 0, y: speed, z: 0 } },
        [ground],
        span,
        options,
      );
      check(`normal speed ${speed} keeps its contact`, hit?.time === 0);
    }
    const penetrating: IAutoMovieProjectile = {
      ...outgoing,
      origin: { x: 0, y: -0.1, z: 0 },
    };
    check(
      "unresolved penetration remains at zero",
      projectileFirstContact(penetrating, [ground], span, {
        radius: 0,
        thickness: options.thickness,
      })?.time === 0,
    );
    check(
      "unrelated id does not suppress penetration",
      projectileFirstContact(penetrating, [ground], span, {
        ...options,
        departing: "other",
      })?.time === 0,
    );
  });

  observe("tail extent", (): void => {
    const fixed: IAutoMovieProjectile = {
      ...outgoing,
      attitude: { kind: "fixed" },
    };
    const tail: IAutoMovieVector3 = { x: 0, y: 0, z: -0.5 };
    check(
      "fixed tail departs",
      projectileFirstContact(fixed, [ground], span, { ...options, tail }) ===
        null,
    );
    check(
      "unclassified rotating tail keeps its touch",
      projectileFirstContact(
        { ...outgoing, attitude: { kind: "spin", axis: up, rate: 30 } },
        [ground],
        span,
        { ...options, tail },
      )?.time === 0,
    );
  });

  const returning: IAutoMovieProjectile = {
    ...outgoing,
    gravity: { x: 0, y: -2, z: 0 },
  };
  observe("full-span reentry", (): void => {
    const hit: IAutoMovieHit | null = projectileFirstContact(
      returning,
      [ground],
      span,
      options,
    );
    check(
      "the same floor is met again at 2v/g",
      hit !== null && hit.collider === ground.id && nclose(hit.time, 1, PhysicalTolerance.CONTACT_TIME),
    );
    const sphere: IAutoMovieHit | null = projectileFirstContact(
      { ...returning, origin: { x: 0, y: 0.1, z: 0 } },
      [ground],
      span,
      { ...options, radius: 0.1 },
    );
    check(
      "sphere clearance retains its radius on reentry",
      sphere !== null && nclose(sphere.time, 1, PhysicalTolerance.CONTACT_TIME),
    );
  });

  observe("other initial collider", (): void => {
    const wall: IAutoMovieProjectileFirstContact.ICollider =
      projectileFirstContact.plane("wall", zero, { x: 1, y: 0, z: 0 });
    for (const colliders of [
      [ground, wall],
      [wall, ground],
    ]) {
      const hit: IAutoMovieHit | null = projectileFirstContact(
        returning,
        colliders,
        span,
        options,
      );
      check(
        "stationary wall contact is not deferred",
        hit?.time === 0 && hit.collider === wall.id,
      );
    }
  });

  observe("other earlier collider", (): void => {
    const wall: IAutoMovieProjectileFirstContact.ICollider =
      projectileFirstContact.plane(
        "wall",
        { x: 0.25, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
      );
    for (const colliders of [
      [ground, wall],
      [wall, ground],
    ]) {
      const hit: IAutoMovieHit | null = projectileFirstContact(
        { ...returning, velocity: { x: 1, y: 1, z: 0 } },
        colliders,
        span,
        options,
      );
      check(
        "wall at distance/speed precedes the floor witness",
        hit !== null &&
          hit.collider === wall.id &&
          nclose(hit.time, 0.25, PhysicalTolerance.CONTACT_TIME),
      );
    }
  });

  observe("actual continuation", (): void => {
    const drop: IAutoMovieProjectile = {
      origin: { x: 0, y: 1, z: 0 },
      velocity: zero,
      gravity: { x: 0, y: -1, z: 0 },
    };
    const first: IAutoMovieHit | null = projectileFirstContact(
      drop,
      [ground],
      { from: 0, to: 3 },
      options,
    );
    check(
      "free fall starts with its analytic impact",
      first !== null && nclose(first.time, Math.sqrt(2), PhysicalTolerance.CONTACT_TIME),
    );
    if (first === null) return;
    const next: IAutoMovieProjectileContinue.Segment = projectileContinue(
      drop,
      first,
      {
        kind: "bounce",
        restitution: 0.5,
        friction: 0,
      },
    );
    check("the resolved impact produces flight", next.kind === "flight");
    if (next.kind !== "flight") return;
    const state: IAutoMovieVector3 = projectileAt(drop, first.time).position;
    check(
      "continuation preserves the actual penetrating impact origin",
      state.y < 0 && Object.is(next.projectile.origin.y, state.y),
    );
    const again: IAutoMovieHit | null = projectileFirstContact(
      next.projectile,
      [ground],
      { from: 0, to: 3 },
      options,
    );
    check(
      "carried contact departs and reenters at 2e sqrt(2gh)/g",
      again !== null &&
        again.time > 0 &&
        nclose(again.time, Math.sqrt(2), PhysicalTolerance.CONTACT_TIME),
    );
  });

  observe("quadratic drag", (): void => {
    const drag: IAutoMovieProjectile = {
      ...returning,
      drag: { coefficient: 2, area: 1, mass: 1, density: 1 },
    };
    const expected: number =
      (Math.atan(1 / Math.sqrt(2)) + Math.acosh(Math.sqrt(1.5))) / Math.sqrt(2);
    const hit: IAutoMovieHit | null = projectileFirstContact(
      drag,
      [ground],
      span,
      options,
    );
    check(
      "vertical quadratic drag meets the closed-form return",
      hit !== null && hit.time > 0 && nclose(hit.time, expected, DRAG_RETURN),
    );
  });

  observe("opaque collider", (): void => {
    const moving: IAutoMovieProjectileFirstContact.ICollider = {
      id: "moving",
      nearest: (
        a: IAutoMovieVector3,
        _b: IAutoMovieVector3,
        seconds: number,
      ): IAutoMovieProjectileFirstContact.INearest => ({
        distance: a.y - 2 * seconds,
        point: { x: a.x, y: 2 * seconds, z: a.z },
        normal: up,
      }),
    };
    check(
      "an id alone cannot classify an opaque moving collider",
      projectileFirstContact(outgoing, [moving], span, {
        ...options,
        departing: moving.id,
      })?.time === 0,
    );
  });

  observe("fixed convex shape", (): void => {
    // A box whose top face lies in the ground plane: its fixed frame proves
    // a resolved departure by that supporting plane, as the plane itself does,
    // while the same box read through an opaque pose keeps the contact.
    const block: IAutoMoviePhysicalShape = {
      id: "block",
      material: "solid",
      kind: "box",
      halfExtents: { x: 1, y: 1, z: 1 },
      transform: {
        position: { x: 0, y: -1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    };
    const frame: IAutoMovieRigidTransform = {
      position: zero,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const fixed: IAutoMovieProjectileFirstContact.ICollider =
      projectileFirstContact.shape("block", block, frame);
    const opaque: IAutoMovieProjectileFirstContact.ICollider =
      projectileFirstContact.shape(
        "block",
        block,
        (): IAutoMovieRigidTransform => frame,
      );
    const resolved: IAutoMovieProjectileFirstContact.IOptions = {
      ...options,
      departing: "block",
    };
    check(
      "a fixed box's supporting plane proves an outgoing departure",
      projectileFirstContact(outgoing, [fixed], span, resolved) === null,
    );
    check(
      "an opaque pose of the same box keeps its initial contact",
      projectileFirstContact(outgoing, [opaque], span, resolved)?.time === 0,
    );
    const thrown: IAutoMovieProjectile = {
      origin: zero,
      velocity: up,
      gravity: { x: 0, y: -2, z: 0 },
    };
    const back: IAutoMovieHit | null = projectileFirstContact(
      thrown,
      [fixed],
      span,
      resolved,
    );
    check(
      "a departed ball meets the fixed box again at 2v/g",
      back !== null && nclose(back.time, 1, PhysicalTolerance.CONTACT_TIME),
    );
  });

  observe("certificate admission", (): void => {
    for (const seconds of [0, NaN, Infinity, 2, 0.5]) {
      let refused: boolean = false;
      try {
        resolveAutoMovieContactEvents({
          from: 0,
          to: 1,
          step: 1,
          weapons: [
            {
              id: "point",
              owner: "point",
              radius: 0,
              position: (time: number): IAutoMovieVector3 => ({
                x: 0,
                y: time,
                z: 0,
              }),
            },
          ],
          bodies: [
            {
              id: "surface",
              distance: (): number => 0,
              departure: (): IAutoMovieResolveContactEvents.Departure => ({
                kind: "clearance",
                seconds,
              }),
            },
          ],
        });
      } catch (error) {
        refused = error instanceof RangeError;
      }
      check(`invalid clearance ${seconds} is refused`, refused);
    }
  });

  TestValidator.predicate(
    `resolved projectile departure findings: ${findings.join("; ")}`,
    findings.length === 0,
  );
}
