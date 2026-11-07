import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** A declared local impulse softens its actuator, grows displacement with momentum, then recovers. */
export async function test_physical_impulse_compliance(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere();
  const child: P.ISegment = structuredClone(profile.segments[0]!);
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
        minimum: -0.8,
        maximum: 0.8,
        stiffness: 20,
        damping: 1,
        maximumTorque: 3,
        channel: "hinge.rotation",
      },
    ],
  });
  const observations: {
    impulse: number;
    strength: number;
    peak: number;
    remaining: number;
  }[] = [];
  for (const impulse of [0.04, 0.08])
    for (const strength of [1, 0.1]) {
      const body: Simulation.IBody = PhysicalFixtures.body("rig", profile, 3);
      for (const target of body.targets) target.strength = 1;
      Object.assign(body, {
        rootStiffness: 1000,
        rootDamping: 100,
        maximumRootForce: 1000,
        rootTorque: { stiffness: 100, damping: 10, maximumTorque: 20 },
        complianceSeconds: 0.8,
        complianceStrength: strength,
      });
      const input: Simulation.IInput = PhysicalFixtures.input([body], 3);
      input.impulses.push({
        step: 60,
        body: "rig",
        bone: "link",
        point: { x: 0, y: 0.6, z: 0 },
        impulse: { x: impulse, y: 0, z: 0 },
      });
      const run: Simulation = await Simulation.compute(input);
      const angles: number[] = run.cache.frames.map(
        (frame: (typeof run.cache.frames)[number]): number => {
          const states: (typeof frame.bodies)[string] = frame.bodies.rig!;
          const rotation: P.ITransform["rotation"] = Quaternion.multiply(
            Quaternion.inverse(states.root!.rotation),
            states.link!.rotation,
          );
          return Math.abs(2 * Math.atan2(rotation.z, rotation.w));
        },
      );
      observations.push({
        impulse,
        strength,
        peak: Math.max(...angles.slice(60, 180)),
        remaining: angles.at(-1)!,
      });
    }
  const findings: string[] = [];
  for (const strength of [1, 0.1]) {
    const low: (typeof observations)[number] = observations.find(
      (row: (typeof observations)[number]): boolean =>
        row.strength === strength && row.impulse === 0.04,
    )!;
    const high: (typeof observations)[number] = observations.find(
      (row: (typeof observations)[number]): boolean =>
        row.strength === strength && row.impulse === 0.08,
    )!;
    if (!(high.peak > low.peak * 1.5))
      findings.push(`impulse growth at strength ${strength}`);
  }
  for (const impulse of [0.04, 0.08]) {
    const firm: (typeof observations)[number] = observations.find(
      (row: (typeof observations)[number]): boolean =>
        row.strength === 1 && row.impulse === impulse,
    )!;
    const soft: (typeof observations)[number] = observations.find(
      (row: (typeof observations)[number]): boolean =>
        row.strength === 0.1 && row.impulse === impulse,
    )!;
    if (!(soft.peak > firm.peak * 1.3))
      findings.push(`compliance response at J=${impulse}`);
  }
  for (const row of observations)
    if (!(row.peak > 0.001 && row.remaining < row.peak * 0.1))
      findings.push(`recovery ${JSON.stringify(row)}`);
  TestValidator.equals(
    `all impulse/compliance observations ${JSON.stringify(observations)}`,
    findings,
    [],
  );
}
