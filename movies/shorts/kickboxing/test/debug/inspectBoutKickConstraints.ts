import {
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { measurePhysicalJointLimits } from "../../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { createBoutPhysicalInput } from "../../src/physics/createBoutPhysicalInput";

/** Separate contact, support feedback and bounded motor contributions on identical high-kick goals; retain every worst frame and target. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const original: Simulation.IInput = createBoutPhysicalInput(
    source,
    1,
    "simulated",
    149.25,
  );
  original.bodies = original.bodies.filter(
    (body: Simulation.IBody): boolean => body.id === "a",
  );
  original.iterations = 32;
  original.internalIterations = 4;
  const rows: object[] = [];
  for (const variant of [
    "baseline",
    "no-self-contact",
    "no-balance",
    "no-support-motors",
    "no-joint-motors",
    "held-extreme",
  ] as const) {
    if (
      process.argv[2] === "remaining" &&
      (variant === "baseline" || variant === "no-self-contact")
    )
      continue;
    const input: Simulation.IInput = structuredClone(original);
    const body: Simulation.IBody = input.bodies[0]!;
    if (variant === "no-self-contact")
      body.profile.collisionExclusions = body.profile.segments.flatMap(
        (a: P.ISegment, first: number): NonNullable<P["collisionExclusions"]> =>
          body.profile.segments
            .slice(first + 1)
            .map(
              (
                b: P.ISegment,
              ): NonNullable<P["collisionExclusions"]>[number] => ({
                a: a.bone,
                b: b.bone,
                reason:
                  "Diagnostic isolation only; never adopted by the production.",
              }),
            ),
      );
    if (variant === "no-balance") {
      delete body.balance;
      for (const target of body.targets) delete target.unavailableSupports;
    }
    if (variant === "no-support-motors") {
      delete body.supportTracking;
      for (const target of body.targets) delete target.supportStrength;
    }
    if (variant === "no-joint-motors")
      for (const target of body.targets)
        target.jointStrength = Object.fromEntries(
          body.profile.joints.map((joint: P.IJoint): [string, number] => [
            joint.id,
            0,
          ]),
        );
    if (variant === "held-extreme")
      for (const target of body.targets)
        target.segments = structuredClone(
          original.bodies[0]!.targets[72]!.segments,
        );
    const begun: number = performance.now();
    const run: Simulation = await Simulation.compute(input);
    let maximum: number = 0;
    let worst: object = {};
    for (const [step, frame] of run.cache.frames.entries())
      for (const joint of body.profile.joints)
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          frame.bodies.a![joint.parent]!,
          frame.bodies.a![joint.child]!,
        ))
          if (coordinate.violation > maximum) {
            maximum = coordinate.violation;
            const states: (typeof frame.bodies)[string] = frame.bodies.a!;
            const goal: Simulation.ITarget = body.targets[step]!;
            worst = {
              step,
              seconds: frame.seconds + 149.25,
              joint,
              coordinate,
              parent: states[joint.parent],
              child: states[joint.child],
              relative: Quaternion.multiply(
                Quaternion.inverse(
                  Quaternion.multiply(
                    states[joint.parent]!.rotation,
                    joint.parentFrame.rotation,
                  ),
                ),
                Quaternion.multiply(
                  states[joint.child]!.rotation,
                  joint.childFrame.rotation,
                ),
              ),
              target: {
                parent: goal.segments[joint.parent],
                child: goal.segments[joint.child],
                coordinates: measurePhysicalJointLimits(
                  joint,
                  goal.segments[joint.parent]!,
                  goal.segments[joint.child]!,
                ),
              },
              speed: Vector3.length(states[joint.child]!.angularVelocity),
            };
          }
    const row: object = {
      variant,
      computeSeconds: (performance.now() - begun) / 1000,
      maximum,
      worst,
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const destination: string = path.resolve(
    ".cache/physical/kick-constraints.inspection.json",
  );
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(rows, null, 2));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
