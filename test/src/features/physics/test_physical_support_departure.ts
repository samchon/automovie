import {
  type AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  bindPhysicalWorld,
  collectPhysicalSupports,
  trackPhysicalSupports,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Actual stance ownership suppresses only compatible stationary tasks, preserving authored support departure.
 *
 * Scenarios:
 * 1. A real floor constraint owns a stationary floor-compatible endpoint.
 * 2. An explicitly reserved endpoint retains its bounded internal task despite contact.
 * 3. A stationary elevated goal and a moving goal retain their bounded internal tasks.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `bindPhysicalWorld` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate; 3 numbered scenarios (first: A real floor constraint owns a stationary floor-compatible endpoint.; last: A stationary elevated goal and a moving goal retain their bounded internal tasks.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A real floor constraint owns a stationary floor-compatible endpoint.; last: A stationary elevated goal and a moving goal retain their bounded internal tasks.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_departure`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A real floor constraint owns a stationary floor-compatible endpoint.).
 */
export async function test_physical_support_departure(): Promise<void> {
  await RAPIER.init();
  const root: P.ISegment = structuredClone(
    PhysicalFixtures.sphere(0.03).segments[0]!,
  );
  root.neutral.position = { x: 0, y: 0.5, z: 0 };
  const foot: P.ISegment = structuredClone(
    PhysicalFixtures.sphere().segments[0]!,
  );
  foot.bone = "foot";
  foot.neutral.position = { x: 0.3, y: 0.0995, z: 0 };
  foot.shapes = [
    {
      id: "sole",
      material: "solid",
      kind: "box",
      halfExtents: { x: 0.1, y: 0.1, z: 0.1 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
  ];
  foot.inertia = { x: 1 / 150, y: 1 / 150, z: 1 / 150 };
  const profile: P = {
    id: "hinged-foot",
    mass: 2,
    centerOfMass: { x: 0.15, y: 0.29975, z: 0 },
    provenance:
      "One unit-mass sphere and one unit-mass uniform 0.2m cube connected by an oblique fixed pivot and a z hinge.",
    materials: PhysicalFixtures.sphere().materials,
    segments: [root, foot],
    joints: [
      {
        id: "hinge",
        parent: "root",
        child: "foot",
        parentFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: root.neutral.rotation,
        },
        childFrame: {
          position: { x: -0.3, y: 0.4005, z: 0 },
          rotation: root.neutral.rotation,
        },
        axes: [
          {
            axis: "z",
            minimum: -1,
            maximum: 1,
            stiffness: 10,
            damping: 1,
            maximumTorque: 100,
            channel: "hinge.angle",
          },
        ],
      },
    ],
  };
  const pattern: Pattern = {
    id: "one-foot",
    minimumSupports: 0,
    limbs: [
      {
        bone: "foot",
        chain: ["foot"],
        localPoint: { x: 0, y: -0.1, z: 0 },
        phase: 0,
        duty: 1,
        offset: { forward: 0, left: 0 },
        stride: [],
      },
    ],
  };
  const body: Simulation.IBody = PhysicalFixtures.body(
    "hinge",
    profile,
    1 / 120,
  );
  body.actuation = "internal";
  body.supportTracking = {
    pattern,
    stiffness: 100,
    damping: 10,
    maximumForce: 100,
    iterations: 0,
  };
  body.balance = {
    pattern,
    maximumStep: 0.5,
    margin: 0,
    duration: 0.2,
    height: 0.1,
    stiffness: 100,
    damping: 10,
    maximumForce: 100,
  };
  for (const target of body.targets) {
    target.strength = 1;
    target.dynamicSegments = ["foot"];
    target.supportStrength = { foot: 1 };
  }
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
  Object.assign(input, { floor: 0, substeps: 1, contactTolerance: 0.0001 });
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    world.timestep = 1 / 120;
    world.integrationParameters.normalizedPredictionDistance = 0;
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    world.step();
    const supports: ReturnType<typeof collectPhysicalSupports> =
      collectPhysicalSupports({
        world,
        body: body.id,
        profile,
        pattern,
        segments: bound.segments.get(body.id)!,
        colliders: bound.colliders,
        contacts: [],
        seconds: 1 / 120,
        dt: 1 / 120,
      });
    TestValidator.predicate(
      "independent hinge has an actual sole constraint",
      supports.some(
        (support: (typeof supports)[number]): boolean =>
          support.bone === "foot",
      ),
    );
    for (const kind of ["stance", "reserved", "elevated", "moving"] as const) {
      const target: Simulation.ITarget = structuredClone(body.targets[0]!);
      if (kind === "reserved") target.unavailableSupports = ["foot"];
      const goals: Parameters<typeof trackPhysicalSupports>[0]["goals"] =
        Object.fromEntries(
          profile.segments.map(
            (
              segment: P.ISegment,
            ): [
              string,
              { pose: P.ITransform; velocity: V; angularVelocity: V },
            ] => [
              segment.bone,
              {
                pose: structuredClone(segment.neutral),
                velocity: {
                  x: 0,
                  y: kind === "moving" && segment.bone === "foot" ? 0.1 : 0,
                  z: 0,
                },
                angularVelocity: { x: 0, y: 0, z: 0 },
              },
            ],
          ),
        );
      goals.foot!.pose.position.x = 0.31;
      goals.foot!.pose.position.y = kind === "elevated" ? 0.2 : 0.1;
      const torques: Map<string, V> = new Map();
      trackPhysicalSupports({
        body,
        target,
        goals,
        segments: bound.segments.get(body.id)!,
        dt: 1 / 120,
        actuation: torques,
        constrained: new Set(
          supports.map(
            (support: (typeof supports)[number]): string => support.bone,
          ),
        ),
        dynamic: new Set(["foot"]),
        floor: 0,
        tolerance: input.contactTolerance!,
      });
      const demand: number = [...torques.values()].reduce(
        (sum: number, torque: V): number => sum + Vector3.length(torque),
        0,
      );
      TestValidator.predicate(
        `${kind} keeps declared task ownership`,
        kind === "stance" ? demand === 0 : demand > 0.001,
      );
    }
  } finally {
    world.free();
  }
}
