import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures as Fixtures } from "../internal/PhysicalFixtures";

/** Two seconds: the authored peak at 0.5 s and a 1.75 s recovery after the impulse. */
const DURATION: number = 2;

/** Impulse step, a quarter second in. */
const IMPULSE: number = 30;

/** Seconds where the displacement is read, just after the impulse. */
const DISPLACED: number = 0.3;

/** Articulated native-joint tracking and bounded disturbance recovery.
 *
 * Scenarios:
 * 1. A two-segment hinge follows a sampled angular goal with a finite motor budget.
 * 2. A real impulse displaces the link and bounded tracking recovers afterward.
 */
export async function test_physical_motor(): Promise<void> {
  const profile: P = Fixtures.sphere();
  profile.id = "hinge";
  const root: P.ISegment = profile.segments[0]!;
  const child: P.ISegment = structuredClone(root);
  child.bone = "link";
  child.neutral.position.y = 0.6;
  profile.segments.push(child);
  profile.mass = 2;
  profile.centerOfMass.y = 0.8;
  profile.joints.push({
    id: "hinge",
    parent: "root",
    child: "link",
    parentFrame: {
      position: { x: 0, y: -0.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    childFrame: {
      position: { x: 0, y: 0.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    axes: [
      {
        axis: "z",
        minimum: -0.6,
        maximum: 0.6,
        stiffness: 20,
        damping: 1,
        maximumTorque: 3,
        channel: "hinge.rotation",
      },
    ],
  });
  const body: Simulation.IBody = Fixtures.body("rig", profile, DURATION);
  Object.assign(body, {
    rootStiffness: 1000,
    rootDamping: 100,
    maximumRootForce: 1000,
    rootTorque: { stiffness: 100, damping: 10, maximumTorque: 20 },
    compensateGravity: true,
  });
  for (const [step, target] of body.targets.entries()) {
    const seconds: number = step / 120;
    const angle: number = 0.3 * Math.sin(Math.PI * seconds);
    const rotation: P.ITransform["rotation"] = {
      x: 0,
      y: 0,
      z: Math.sin(angle / 2),
      w: Math.cos(angle / 2),
    };
    const offset: P.ITransform["position"] = Quaternion.rotateVector(rotation, {
      x: 0,
      y: -0.2,
      z: 0,
    });
    target.segments.link = {
      position: { x: offset.x, y: 0.8 + offset.y, z: offset.z },
      rotation,
    };
    target.strength = 1;
  }
  const input: Simulation.IInput = Fixtures.input([body], DURATION);
  input.gravity.y = -9.81;
  input.floor = 0;
  const baseline: Simulation = await Simulation.compute(input);
  const disturbed: Simulation.IInput = structuredClone(input);
  disturbed.impulses.push({
    step: IMPULSE,
    body: "rig",
    bone: "link",
    point: { x: 0, y: 0.6, z: 0 },
    impulse: { x: 0.2, y: 0, z: 0 },
  });
  const response: Simulation = await Simulation.compute(disturbed);
  const resumed: Simulation = await Simulation.compute(disturbed, baseline);
  TestValidator.predicate(
    "articulated motor checkpoint preserves exact frames",
    JSON.stringify(resumed.cache.frames) ===
      JSON.stringify(response.cache.frames),
  );
  TestValidator.predicate(
    "articulated motor checkpoint preserves exact contacts",
    JSON.stringify(resumed.cache.contacts) ===
      JSON.stringify(response.cache.contacts),
  );
  const angleAt: (run: Simulation, seconds: number) => number = (
    run: Simulation,
    seconds: number,
  ): number => {
    const frame: ReturnType<typeof run.cache.at> = run.cache.at(seconds);
    const relative: P.ITransform["rotation"] = Quaternion.multiply(
      Quaternion.inverse(frame.bodies.rig!.root!.rotation),
      frame.bodies.rig!.link!.rotation,
    );
    return 2 * Math.atan2(relative.z, relative.w);
  };
  const error: number = Math.abs(angleAt(baseline, 0.5) - 0.3);
  const displaced: number = Math.abs(
    angleAt(response, DISPLACED) - angleAt(baseline, DISPLACED),
  );
  const recovered: number = Math.abs(
    angleAt(response, DURATION) - angleAt(baseline, DURATION),
  );
  TestValidator.predicate(
    "bounded motors track the authored angle",
    error < 0.08,
  );
  TestValidator.predicate(
    "physical disturbance displaces then recovers",
    displaced > 0.001 && recovered < displaced * 0.3,
  );
}
