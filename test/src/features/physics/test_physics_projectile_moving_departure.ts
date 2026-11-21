import { Quaternion, projectileFirstContact } from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ProjectileMovingPartFixture as Part } from "../internal/ProjectileMovingPartFixture";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Report a ball's first new contact after a certified moving-shape departure.
 *
 * Scenarios:
 * 1. Tangent spheres separate and reenter at the independent quadratic root.
 *    Closing motion, an opaque pose, an unmarked pair and a different tangent
 *    shape preserve initial contact. A path that separates, re-enters inside
 *    the bounded prefix and is clear again at its end keeps the contact or
 *    reports that re-entry, never the later clearance.
 * 2. A rotating offset hull supports a shallow-overlap departure. Another part
 *    of the same actor remains a distinct pair on the same motion clock.
 * 3. Offset angular motion, an absent proof and malformed declarations exercise
 *    the certificate boundary. A nonzero query start retains its launch clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the signed-gap oracles, independent shape pairs, motion admission and launch-clock behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Uses stock public builders and contact sweep with actual independent sphere and convex-hull witnesses, without injecting clearance or inspecting private proof state.
 * @evidence contracts/development/testing.md#independent-expectations Signed gaps come from the fixture's independently declared quadratic trajectories and the known upper collider plane. All first-hit points and normals follow from those shapes, their translation, and the explicit launch clock.
 * @evidence contracts/development/testing.md#distinguishing-cases Same geometry with opposite relative motion, separate and simultaneous part IDs, declared and absent motion, initial shallow overlap and malformed data distinguish the failure paths.
 * @evidence contracts/development/testing.md#execution-ownership The shared test runner executes pure public Engine builders and sweeps against local finite geometry. Rigid part poses come from the maintained `ProjectileMovingPartFixture`, which the moving-performer consumer of #3827 shares.
 */
export function test_physics_projectile_moving_departure(): void {
  const sphere: IAutoMoviePhysicalShape = baseSphere(ZERO);
  const separating: IAutoMovieProjectileFirstContact.IContinuousPose =
    Part.rising(0.5);
  const moving: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("moving", sphere, separating);
  const contact: IAutoMovieHit | null = query(BALL, [moving], "moving");
  TestValidator.predicate(
    "the certified separation preserves the sphere's first return at 0.5s",
    matches(contact, "moving", 0.5, { x: 0, y: 0.375, z: 0 }, UP),
  );
  const closing: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("moving", sphere, Part.rising(1));
  TestValidator.predicate(
    "negative relative opening preserves the initial sphere contact",
    matches(
      query(BALL, [closing], "moving"),
      "moving",
      0,
      { x: 0, y: 0.125, z: 0 },
      UP,
    ),
  );
  const opaque: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("moving", sphere, separating.at);
  TestValidator.predicate(
    "an opaque pose and the unmarked bounded pair each report initial contact",
    query(BALL, [opaque], "moving")?.time === 0 &&
      query(BALL, [moving])?.time === 0,
  );
  const other: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("other", sphere, {
      position: { x: 0.25, y: 0.25, z: 0 },
      rotation: Quaternion.identity(),
    });
  TestValidator.predicate(
    "another tangent collider retains its initial contact",
    matches(
      query(BALL, [moving, other], "moving"),
      "other",
      0,
      { x: 0.125, y: 0.25, z: 0 },
      { x: -1, y: 0, z: 0 },
    ),
  );

  const curved: IAutoMovieProjectileFirstContact.IContinuousPose = {
    at: (seconds): IAutoMovieRigidTransform => ({
      position: { x: 0, y: 0.5 * seconds + 0.125 * seconds * seconds, z: 0 },
      rotation: Quaternion.identity(),
    }),
    bound: (from, to): IAutoMovieProjectileFirstContact.IMotionBound => {
      const end: number = Math.min(to, from + 0.0625);
      return {
        to: end,
        referenceVelocity: { x: 0, y: 0.5 + 0.25 * from, z: 0 },
        velocityError: 0.25 * (end - from),
        angularSpeed: 0,
      };
    },
  };
  const curvedReturn: number = 4 / 9;
  TestValidator.predicate(
    "a bounded nonlinear pose certifies only its prefix and preserves later reentry",
    matches(
      query(
        BALL,
        [projectileFirstContact.shape("curved", sphere, curved)],
        "curved",
      ),
      "curved",
      curvedReturn,
      { x: 0, y: 0.125 + 0.5 * curvedReturn + 0.125 * curvedReturn ** 2, z: 0 },
      UP,
    ),
  );

  // The signed gap DIP·t·(t − 0.02)·(t − 0.04) opens, closes again at 0.02 s
  // inside the 0.0625 s prefix and is positive again at its end. Positive
  // clearance at the prefix end alone must not hide that re-entry.
  const dipping: IAutoMovieProjectileFirstContact.IContinuousPose = {
    at: (seconds): IAutoMovieRigidTransform => ({
      position: {
        x: 0,
        y:
          seconds -
          seconds * seconds -
          DIP * seconds * (seconds - 0.02) * (seconds - 0.04),
        z: 0,
      },
      rotation: Quaternion.identity(),
    }),
    bound: (from, to): IAutoMovieProjectileFirstContact.IMotionBound => {
      const end: number = Math.min(to, from + 0.0625);

      // |v − 1| ≤ 2t + DIP·(3t² + 0.12t + 0.0008), increasing in t ≥ 0.
      return {
        to: end,
        referenceVelocity: UP,
        velocityError: 2 * end + DIP * (3 * end * end + 0.12 * end + 0.0008),
        angularSpeed: 0,
      };
    },
  };
  const dipped: IAutoMovieHit | null = query(
    BALL,
    [projectileFirstContact.shape("dipping", sphere, dipping)],
    "dipping",
  );
  TestValidator.predicate(
    "a brief separation inside the prefix keeps contact or reports its re-entry",
    matches(dipped, "dipping", 0, { x: 0, y: 0.125, z: 0 }, UP) ||
      matches(dipped, "dipping", 0.02, { x: 0, y: 0.1446, z: 0 }, UP),
  );

  const glancing: IAutoMovieProjectile = {
    ...BALL,
    velocity: { x: 2, y: 1, z: 0 },
  };
  TestValidator.predicate(
    "a faster tangential component preserves a genuine glancing departure",
    matches(
      query(
        glancing,
        [projectileFirstContact.shape("wide", hull(2), separating)],
        "wide",
      ),
      "wide",
      0.5,
      { x: 1, y: 0.375, z: 0 },
      UP,
    ),
  );

  const depth: number = 1 / 1024;
  const overlapping: IAutoMovieProjectile = {
    ...BALL,
    origin: { x: 0, y: BALL.origin.y - depth, z: 0 },
  };
  const returnTime: number = (0.5 + Math.sqrt(0.25 - 4 * depth)) / 2;
  const actor: IAutoMovieProjectileFirstContact.IContinuousPose = Part.part({
    velocity: { x: 0, y: 0.5, z: 0 },
    axis: UP,
    angularVelocity: 0.125,
    angularBound: 0.2,
  });
  const torso: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("actor:torso", hull(), actor);
  TestValidator.predicate(
    "the measured initial overlap belongs to the hull without its certificate",
    nclose(
      torso.distance!(overlapping.origin, overlapping.origin, 0) - RADIUS,
      -depth,
      1e-12,
    ) && query(overlapping, [torso])?.time === 0,
  );
  TestValidator.predicate(
    "a yawing convex hull returns at the independent quadratic root",
    matches(
      query(overlapping, [torso], "actor:torso"),
      "actor:torso",
      returnTime,
      { x: 0, y: 0.125 + 0.5 * returnTime, z: 0 },
      UP,
    ),
  );
  const wrist: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape(
      "actor:wrist",
      baseSphere({ x: 0.25, y: overlapping.origin.y, z: 0 }),
      actor,
    );
  TestValidator.predicate(
    "another placed part using the same actor frame is still eligible",
    matches(
      query(overlapping, [torso, wrist], "actor:torso"),
      "actor:wrist",
      0,
      { x: 0.125, y: overlapping.origin.y, z: 0 },
      { x: -1, y: 0, z: 0 },
    ),
  );

  const offset: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const leverPose: IAutoMovieProjectileFirstContact.IContinuousPose = Part.part(
    { axis: offset, angularVelocity: 1 },
  );
  const offsetBall: IAutoMovieProjectile = {
    origin: { x: 1, y: 0.25, z: 0 },
    velocity: { x: 0, y: 0.5, z: 0 },
    gravity: ZERO,
  };
  TestValidator.predicate(
    "the shape's parent offset contributes rotational reach",
    query(
      offsetBall,
      [projectileFirstContact.shape("lever", baseSphere(offset), leverPose)],
      "lever",
    )?.time === 0,
  );

  const unavailable: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("unavailable", sphere, {
      ...separating,
      bound: () => undefined,
    });
  TestValidator.predicate(
    "an unavailable continuous motion bound keeps the initial pair",
    query(BALL, [unavailable], "unavailable")?.time === 0,
  );
  const malformed: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("malformed", sphere, {
      ...separating,
      bound: (_from, to): IAutoMovieProjectileFirstContact.IMotionBound => ({
        to,
        referenceVelocity: ZERO,
        velocityError: -1,
        angularSpeed: 0,
      }),
    });
  TestValidator.error("negative velocity uncertainty refuses admission", () =>
    query(BALL, [malformed], "malformed"),
  );
  const nonRigid: IAutoMovieProjectileFirstContact.ICollider =
    projectileFirstContact.shape("nonrigid", sphere, {
      ...separating,
      at: (seconds): IAutoMovieRigidTransform => ({
        position: separating.at(seconds).position,
        rotation: { x: 0, y: 0, z: 0, w: seconds === 0 ? 1 : 2 },
      }),
    });
  TestValidator.error(
    "the positive-gap endpoint must supply a rigid pose",
    () => query(BALL, [nonRigid], "nonrigid"),
  );

  const later: IAutoMovieProjectile = {
    ...BALL,
    origin: { x: 0, y: -1.75, z: 0 },
    velocity: { x: 0, y: 3, z: 0 },
  };
  TestValidator.predicate(
    "a nonzero span start preserves the flight clock",
    matches(
      query(
        later,
        [projectileFirstContact.shape("later", sphere, Part.rising(0.5, 1))],
        "later",
        1,
      ),
      "later",
      1.5,
      { x: 0, y: 0.375, z: 0 },
      UP,
    ),
  );
}

/** Two tangent spheres have the same radius, in metres. */
const RADIUS: number = 0.125;

/** Cubic dip coefficient of the re-entering path, metres per second cubed. */
const DIP: number = 100;

/** A shared stationary vector for independent fixture geometry. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** World up is the normal at the upper surface of each vertical oracle. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** y = 0.25 + t − t² gives a signed gap of 0.5t − t² against the rising shape. */
const BALL: IAutoMovieProjectile = {
  origin: { x: 0, y: 0.25, z: 0 },
  velocity: UP,
  gravity: { x: 0, y: -2, z: 0 },
};

/** The physical sphere and its local offset are explicit. */
function baseSphere(position: IAutoMovieVector3): IAutoMoviePhysicalShape {
  return {
    id: "sphere",
    material: "fixture",
    kind: "sphere",
    radius: RADIUS,
    transform: { position, rotation: Quaternion.identity() },
  };
}

/** The offset hull's top plane is y = 0.125 in its parent's frame. */
function hull(width: number = 0.125): IAutoMoviePhysicalShape {
  const points: IAutoMovieVector3[] = [];
  for (const x of [-width, width])
    for (const y of [-0.0625, 0.0625])
      for (const z of [-0.125, 0.125]) points.push({ x, y, z });
  return {
    id: "hull",
    material: "fixture",
    kind: "hull",
    points,
    transform: {
      position: { x: 0, y: 0.0625, z: 0 },
      rotation: Quaternion.identity(),
    },
  };
}

/** Query the same finite span for each independent control. */
function query(
  projectile: IAutoMovieProjectile,
  colliders: readonly IAutoMovieProjectileFirstContact.ICollider[],
  departing?: string,
  from: number = 0,
): IAutoMovieHit | null {
  return projectileFirstContact(
    projectile,
    colliders,
    { from, to: from + 0.625 },
    {
      radius: RADIUS,
      thickness: 0.125,
      ...(departing === undefined ? {} : { departing }),
    },
  );
}

/** Require the selected geometry and its time to match the analytic witness. */
function matches(
  hit: IAutoMovieHit | null,
  id: string,
  time: number,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): boolean {
  return (
    hit !== null &&
    hit.collider === id &&
    nclose(hit.time, time, 1e-7) &&
    vclose(hit.point, point, 1e-7) &&
    hit.normal !== undefined &&
    vclose(hit.normal, normal, 1e-7)
  );
}
