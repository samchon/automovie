import { type Archetype, ArchetypeRefusal } from "@automovie/archetypes";
import {
  createInstrument,
  createUprightPiano,
} from "@automovie/archetypes/music";
import {
  createBall,
  createBasketballHoop,
  createGoal,
  createLacrosseCrosse,
  createOvalBall,
  createPuck,
  createSphericalBall,
  createTennisNet,
  createVolleyballNet,
} from "@automovie/archetypes/sport";
import { createClub } from "@automovie/archetypes/weapons";
import {
  Quaternion,
  Vector3,
  projectileAt,
  projectileContinue,
  projectileFirstContact,
} from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileFirstContact,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** The stationary court's model origin, in metres. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Canonical instrument and sport props retain contacts through public staging
 * and physical playback.
 *
 * Scenarios:
 * 1. A key and pedal still enter a prop with articulations, a crosse has a
 *    recessed pocket distinct from its scoop, and a puck has an edge midway
 *    up its flat disc.
 * 2. A ball crosses the real hoop's outer front and a tennis net's collision
 *    panel. An otherwise equal throw above the net clears it.
 * 3. A basketball's published restitution gives a FIBA-range floor rebound.
 *    A staged oval ball at ninety degrees rotates its long playing axis.
 * 4. Saved kinds route to canonical factories and still refuse a length from
 *    another ball shape, a fixed volleyball class height and a foreign bat
 *    model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the public staging, physical observations and malformed saved settings.
 * @evidence contracts/development/testing.md#behavioral-verification Read the actual models through HumanObject.prop, then resolve real projectile contacts and continue a floor rebound. Assert the compatibility dispatcher still diagnoses the given field.
 * @evidence contracts/development/testing.md#independent-expectations The basketball ring and net witnesses use FIBA and ITF placements, the FIBA drop interval determines the rebound interval, and the IIHF puck dimensions set its edge and top. Shaft and yaw axes follow the stated model frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive contacts and a cleared net separate material from empty space, and three adjacent saved settings test distinct refusal sources. The music and field-sport performance tests cover the individual actor's contacts.
 * @evidence contracts/development/testing.md#execution-ownership The named in-memory test uses the shipped staging and physics readers with local props and no host.
 */
export function test_archetype_catalogue_music_sports(): void {
  const piano: IAutoMovieMotionHumanProp = HumanObject.prop(
    "piano",
    createUprightPiano({}, 7),
    { at: ORIGIN, yaw: 0, fixed: true },
  );
  TestValidator.predicate(
    "piano has graduated keys and a moving damper pedal",
    piano.hasArticulations === true &&
      piano.affordances?.filter(({ id }) => /^key[0-9]+$/.test(id)).length ===
        88 &&
      piano.affordances.some(
        ({ id, kind }): boolean => id === "damperPedal" && kind === "pedal",
      ),
  );

  const crosse: ReturnType<typeof createLacrosseCrosse> = createLacrosseCrosse(
    {},
    "sports",
  );
  TestValidator.predicate(
    "the crosse pocket lies behind the active scoop",
    crosse.affordance("pocket").frame.translation.z < 0 &&
      crosse.affordance("scoop").frame.translation.z > 0 &&
      crosse.affordance("blade").frame.translation.z === 0,
  );

  const puck: ReturnType<typeof createPuck> = createPuck({}, 7);
  TestValidator.predicate(
    "the calibrated puck rim is radial and midway up the disc",
    vclose(
      puck.affordance("rim").frame.translation,
      { x: 0, y: 0.0125, z: 0.038 },
      1e-6,
    ) && nclose(puck.affordance("top").frame.translation.y, 0.025, 1e-6),
  );

  const hoop: ReturnType<typeof createBasketballHoop> = createBasketballHoop(
    { ring: 0.45, bar: 0.018 },
    7,
  );
  const ball: ReturnType<typeof createSphericalBall> = createSphericalBall(
    { kind: "basketball" },
    7,
  );
  const radius: number = ball.dimensions.diameter! / 2;
  const rimHeight: number = 3.05 - 0.018 / 2;
  const rimFront: number = 0.151 + 0.45 + 0.018;
  const hitRim: IAutoMovieHit | null = inbound(hoop, 0, rimHeight, radius);
  TestValidator.predicate(
    "the ball hits the rim at the actual front face",
    hitRim?.collider === "ring-1" &&
      vclose(hitRim.point, { x: 0, y: rimHeight, z: rimFront }, 1e-5),
  );

  const net: ReturnType<typeof createTennisNet> = createTennisNet({}, "sports");
  const hitNet: IAutoMovieHit | null = inbound(net, 1, 0.6, 0.033);
  TestValidator.predicate(
    "the ball meets the front of the panel but clears over the net",
    hitNet?.collider === "net-left" &&
      vclose(hitNet.point, { x: 1, y: 0.6, z: 0.0025 }, 1e-5) &&
      inbound(net, 1, 1.2, 0.033) === null,
  );

  const volleyballNet: ReturnType<typeof createVolleyballNet> =
    createVolleyballNet({ net: "women" }, 7);
  TestValidator.predicate(
    "a women's net places its playing top at the FIVB class height",
    nclose(volleyballNet.affordance("top").frame.translation.y, 2.24, 1e-6),
  );

  const bounce: number = rebound(ball, radius);
  TestValidator.predicate(
    "the bottom of the released basketball rebounds to FIBA height",
    bounce >= 1.035 && bounce <= 1.085,
  );

  const oval: IAutoMovieMotionHumanProp = HumanObject.prop(
    "oval",
    createOvalBall({ kind: "rugby", length: 0.29 }, 7),
    { at: ORIGIN, yaw: 90 },
  );
  const capsule: IAutoMoviePhysicalShape | undefined = oval.shapes?.[0];
  TestValidator.predicate(
    "the long X collider rotates into the court's Z direction",
    capsule?.kind === "capsule" &&
      nclose(2 * (capsule.radius + capsule.halfLength), 0.29, 1e-6) &&
      vclose(
        unsignedAxis(
          Quaternion.rotateVector(
            oval.frame.rotation,
            Quaternion.rotateVector(capsule.transform.rotation, {
              x: 0,
              y: 1,
              z: 0,
            }),
          ),
        ),
        { x: 0, y: 0, z: 1 },
        1e-6,
      ),
  );

  TestValidator.equals(
    "saved keys select canonical factories",
    [
      createInstrument.PRODUCERS.uprightPiano === createUprightPiano,
      createGoal.PRODUCERS.tennisNet === createTennisNet,
      createBall.PRODUCERS.puck === createPuck,
    ],
    [true, true, true],
  );
  refusal(() => createBall({ kind: "tennis", length: 0.12 }, 7), "length");
  refusal(
    () => createGoal({ kind: "volleyballNet", height: 2.24 }, 7),
    "height",
  );
  refusal(() => createClub({ kind: "bat", model: "mp24" }, 7), "model");
}

/** Shoot from in front of the court plane into a fixed staged prop. */
function inbound(
  model: Archetype,
  x: number,
  y: number,
  radius: number,
): IAutoMovieHit | null {
  const target: IAutoMovieMotionHumanProp = HumanObject.prop("court", model, {
    at: ORIGIN,
    yaw: 0,
    fixed: true,
  });
  const colliders: IAutoMovieProjectileFirstContact.ICollider[] = (
    target.shapes ?? []
  ).map(
    (
      shape: IAutoMoviePhysicalShape,
    ): IAutoMovieProjectileFirstContact.ICollider =>
      projectileFirstContact.shape(shape.id, shape, target.frame),
  );
  return projectileFirstContact(
    {
      origin: { x, y, z: 1.4 },
      velocity: { x: 0, y: 0, z: -2 },
      gravity: ORIGIN,
    },
    colliders,
    { from: 0, to: 1 },
    { radius, thickness: 0.005 },
  );
}

/** Drop the ball from 1.8 m measured at its underside, then read its rebound apex. */
function rebound(ball: Archetype, radius: number): number {
  const projectile: IAutoMovieProjectile = {
    origin: { x: 0, y: 1.8 + radius, z: 0 },
    velocity: ORIGIN,
    gravity: { x: 0, y: -9.80665, z: 0 },
  };
  const contact: IAutoMovieHit | null = projectileFirstContact(
    projectile,
    [projectileFirstContact.plane("floor", ORIGIN, { x: 0, y: 1, z: 0 })],
    { from: 0, to: 1 },
    { radius, thickness: 0.01 },
  );
  const restitution: number | undefined = ball.body.restitution;
  if (contact === null || restitution === undefined)
    throw new Error("The staged basketball needs a floor hit and restitution");
  const bounce: IAutoMovieProjectileContinue.Segment = projectileContinue(
    projectile,
    contact,
    { kind: "bounce", restitution, friction: 0 },
  );
  if (bounce.kind !== "flight") throw new Error("The ball did not rebound");
  const apex: number = bounce.projectile.velocity.y / 9.80665;
  return projectileAt(bounce.projectile, apex).position.y - radius;
}

/** Treat both ends of the long axis as equivalent. */
function unsignedAxis(axis: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.create(Math.abs(axis.x), Math.abs(axis.y), Math.abs(axis.z));
}

/** Require the named runtime diagnostic for an invalid saved recipe. */
function refusal(produce: () => Archetype, axis: string): void {
  assert.throws(
    produce,
    (error: unknown): boolean =>
      error instanceof ArchetypeRefusal &&
      error.kind === "parameter" &&
      error.axis === axis,
  );
}
