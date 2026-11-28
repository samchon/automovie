import {
  AutoMovieEnginePhysicalPlayback,
  AutoMovieEnginePhysicalSimulation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Cached intervals per second, the pin deck's rate. */
const RATE: number = 120;

/** Film seconds the rack is solved over. */
const DURATION: number = 0.5;

/**
 * `AutoMovieEnginePhysicalSimulation.compute` solves a minimal pin rack, one ball
 * striking one pin head-on in free space, and `AutoMovieEnginePhysicalPlayback`
 * replays the solve from its archive.
 *
 * Fixture: no gravity; a 1 kg sphere of radius 0.1 m at the origin moving +z at
 * V = 2 m/s (its first target one interval ahead), and a 1 kg cube of half
 * extent 0.05 m at rest at z = 0.5. The gap 0.5 - 0.1 - 0.05 = 0.35 m closes at
 * t0 = 0.35 / 2 = 0.175 s. With no external force the total linear momentum
 * stays m V = 2 kg m/s; a central hit along z leaves x and y at rest.
 *
 * Scenarios:
 *
 * 1. The ball starts at V, and the pin stands on its spot, at rest, at 0.1 s.
 * 2. The first ball-pin solver contact with positive impulse falls within two
 *    intervals of t0.
 * 3. At the end the momentum along z is m V within 2 percent; the pin moves faster
 *    than the ball, the ball no faster than V, and neither drifts off the z
 *    axis by more than 1e-6 m.
 * 4. The archive, decoded under the solve's identity and budgets, reads every body
 *    at the end, the start, the contact and the midpoint (out of time order)
 *    exactly as the live cache does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents first contact and momentum of a free-space ball and pin, and playback archive reads across the solve clock.
 * @evidence contracts/development/testing.md#behavioral-verification Solves the two-body system, reads positive solver contacts, and decodes its real archive for out-of-order replay against the live cache.
 * @evidence contracts/development/testing.md#independent-expectations A 0.35 m gap at 2 m/s closes at 0.175 s. No external force fixes total z momentum at 2 kg·m/s and symmetry forbids transverse drift beyond the stated tolerance.
 */
export async function test_engine_physics_rack_impact(): Promise<void> {
  const material: IAutoMoviePhysicalMaterial = {
    id: "fixture",
    friction: 0.3,
    restitution: 0.1,
    compliance: 0,
    damping: 0,
  };
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const profile = (
    id: string,
    shape: IAutoMoviePhysicalShape,
    inertia: number,
  ): IAutoMoviePhysicalProfile => ({
    id,
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    materials: [material],
    provenance: "Authored unit-mass test body.",
    joints: [],
    segments: [
      {
        bone: "root",
        mass: 1,
        neutral: origin,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: inertia, y: inertia, z: inertia },
        inertiaRotation: origin.rotation,
        shapes: [shape],
      },
    ],
  });
  const steps: number = DURATION * RATE;
  const body = (
    id: string,
    shape: IAutoMoviePhysicalShape,
    inertia: number,
    at: IAutoMovieVector3,
    speed: number,
  ): IAutoMoviePhysicalSimulationInput.IBody => {
    const target = (z: number): IAutoMoviePhysicalSimulationInput.ITarget => ({
      strength: 0,
      dynamicSegments: ["root"],
      segments: { root: { ...origin, position: { ...at, z } } },
    });
    return {
      id,
      profile: profile(id, shape, inertia),
      mode: { kind: "simulated" },
      targets: Array.from(
        { length: steps + 1 },
        (_: unknown, i: number): IAutoMoviePhysicalSimulationInput.ITarget =>
          target(i === 1 ? at.z + speed / RATE : at.z),
      ),
      rootStiffness: 0,
      rootDamping: 0,
      maximumRootForce: 0,
      complianceSeconds: 0,
      complianceStrength: 0,
    };
  };
  const V: number = 2;
  const pinAt: IAutoMovieVector3 = { x: 0, y: 0, z: 0.5 };
  const input: IAutoMoviePhysicalSimulationInput.IInput = {
    duration: DURATION,
    rate: RATE,
    substeps: 4,
    gravity: { x: 0, y: 0, z: 0 },
    floor: -100,
    floorBounds: { min: { x: -1, z: -1 }, max: { x: 1, z: 2 }, thickness: 1 },
    bodies: [
      body(
        "ball",
        {
          id: "ball",
          material: "fixture",
          transform: origin,
          kind: "sphere",
          radius: 0.1,
        },
        (2 / 5) * 0.1 ** 2,
        origin.position,
        V,
      ),
      body(
        "pin",
        {
          id: "pin",
          material: "fixture",
          transform: origin,
          kind: "box",
          halfExtents: { x: 0.05, y: 0.05, z: 0.05 },
        },
        (2 / 3) * 0.05 ** 2,
        pinAt,
        0,
      ),
    ],
    impulses: [],
    checkpointEvery: RATE,
    yieldEvery: RATE,
    maximumSteps: steps,
    maximumSegments: 2,
  };
  const solved: IAutoMoviePhysicalSimulation =
    await AutoMovieEnginePhysicalSimulation.compute(input);
  const cache: IAutoMoviePhysicalSimulation["cache"] = solved.cache;
  const root = (frame: IAutoMoviePhysicalFrame, id: string) =>
    frame.bodies[id]!.root!;

  // 1.
  TestValidator.predicate(
    "ball starts at V",
    Math.abs(root(cache.at(0), "ball").velocity.z - V) <= 1e-5,
  );
  const early = root(cache.at(0.1), "pin");
  TestValidator.predicate(
    "pin at rest before contact",
    Math.hypot(
      early.position.x - pinAt.x,
      early.position.y - pinAt.y,
      early.position.z - pinAt.z,
    ) <= 1e-6 &&
      Math.hypot(early.velocity.x, early.velocity.y, early.velocity.z) <= 1e-6,
  );

  // 2.
  const contacts: number[] = cache.contacts
    .filter(
      (c: (typeof cache.contacts)[number]): boolean =>
        c.source === "solver" &&
        (c.impulse ?? 0) > 0 &&
        [c.a.body, c.b.body].includes("ball") &&
        [c.a.body, c.b.body].includes("pin"),
    )
    .map((c: (typeof cache.contacts)[number]): number => c.seconds);
  const first: number = Math.min(...contacts);
  TestValidator.predicate(
    `first contact ${first} near 0.175`,
    Math.abs(first - 0.175) <= 2 / RATE,
  );

  // 3.
  const ball = root(cache.at(DURATION), "ball");
  const pin = root(cache.at(DURATION), "pin");
  TestValidator.predicate(
    "momentum kept",
    Math.abs(ball.velocity.z + pin.velocity.z - V) <= 0.02 * V,
  );
  TestValidator.predicate(
    "pin outruns the ball",
    pin.velocity.z > ball.velocity.z && ball.velocity.z <= V,
  );
  TestValidator.predicate(
    "on the axis",
    [ball, pin].every(
      (s: typeof ball): boolean =>
        Math.abs(s.position.x) <= 1e-6 && Math.abs(s.position.y) <= 1e-6,
    ),
  );

  // 4.
  const bytes: number = 1 << 24;
  const playback: IAutoMoviePhysicalPlayback =
    await AutoMovieEnginePhysicalPlayback.decode(
      await AutoMovieEnginePhysicalPlayback.encode(cache, bytes),
      cache.identity,
      { maximumBytes: bytes, maximumFrames: steps + 1, maximumSegments: 2 },
    );
  for (const seconds of [DURATION, 0, first, DURATION / 2])
    TestValidator.equals(
      `archive at ${seconds}`,
      JSON.stringify(playback.at(seconds).bodies),
      JSON.stringify(cache.at(seconds).bodies),
    );
}
