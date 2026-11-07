import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { measurePhysicalJointLimits } from "../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { projectPhysicalTargets } from "../../../../packages/engine/src/physics/projectPhysicalTargets";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Compound motion at a transverse limit stays inside every native angular bound.
 *
 * Scenarios:
 * 1. An unequal-mass primitive lever bends and returns while its third coordinate sweeps.
 * 2. Interior and boundary transverse targets preserve the same 0.01 rad tolerance.
 */
export async function test_physical_compound_motor(): Promise<void> {
  const findings: string[] = [];
  for (const transverse of [0.35, 0.7]) {
    const base: P = PhysicalFixtures.sphere();
    const parent: P.ISegment = {
      ...structuredClone(base.segments[0]!),
      bone: "base",
      mass: 10,
      inertia: { x: 0.1, y: 0.1, z: 0.1 },
    };
    const child: P.ISegment = {
      ...structuredClone(base.segments[0]!),
      bone: "lever",
      mass: 5,
      centerOfMass: { x: 0, y: -0.3, z: 0 },
      inertia: { x: 0.15, y: 0.01, z: 0.15 },
      shapes: [
        {
          id: "lever",
          kind: "capsule",
          radius: 0.05,
          halfLength: 0.25,
          material: base.materials[0]!.id,
          transform: {
            position: { x: 0, y: -0.3, z: 0 },
            rotation: Quaternion.identity(),
          },
        },
      ],
    };
    const joint: P.IJoint = {
      id: "universal",
      parent: "base",
      child: "lever",
      parentFrame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      },
      childFrame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      },
      axes: (["x", "y", "z"] as const).map(
        (axis: "x" | "y" | "z"): P.IAxis => ({
          axis,
          minimum: axis === "x" ? -0.4 : -0.7,
          maximum: axis === "x" ? 2.4 : 0.7,
          stiffness: 540,
          damping: 36,
          maximumTorque: 400,
          channel: axis,
        }),
      ),
    };
    const profile: P = {
      ...base,
      id: "unequal-primitive-lever",
      mass: 15,
      centerOfMass: { ...base.centerOfMass, y: base.centerOfMass.y - 0.1 },
      segments: [parent, child],
      joints: [joint],
    };
    const body: Simulation.IBody = PhysicalFixtures.body(
      "mechanism",
      profile,
      1,
    );
    Object.assign(body, {
      rootStiffness: 1500,
      rootDamping: 225,
      maximumRootForce: 1000,
      rootTorque: { stiffness: 100, damping: 20, maximumTorque: 200 },
    });
    for (const [step, target] of body.targets.entries()) {
      target.strength = 1;
      const fraction: number = Math.min(1, step / 120 / 0.6);
      const q: P.ITransform["rotation"] = {
        x: Math.tan(1.1 * Math.sin(fraction * Math.PI)),
        y: Math.tan(transverse / 2),
        z: Math.tan(0.25 * Math.sin(fraction * Math.PI * 2)),
        w: 1,
      };
      const norm: number = Math.hypot(q.x, q.y, q.z, 1);
      target.segments.lever!.rotation = {
        x: q.x / norm,
        y: q.y / norm,
        z: q.z / norm,
        w: 1 / norm,
      };
      target.segments = projectPhysicalTargets(
        profile,
        target.segments,
      ).targets;
    }
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
    input.substeps = 32;
    input.iterations = 64;
    input.internalIterations = 16;
    const run: Simulation = await Simulation.compute(input);
    let maximum: number = 0;
    for (const frame of run.cache.frames)
      for (const coordinate of measurePhysicalJointLimits(
        joint,
        frame.bodies.mechanism!.base!,
        frame.bodies.mechanism!.lever!,
      ))
        maximum = Math.max(maximum, coordinate.violation);
    if (maximum > 0.01)
      findings.push(`${transverse}: compound constraint error ${maximum}`);
  }
  TestValidator.equals("all compound motor observations", findings, []);
}
