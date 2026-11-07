import {
  Quaternion,
  type AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  projectPhysicalTargets,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import assert from "node:assert/strict";

import { BoutTargetSource } from "../../../src/physics/BoutTargetSource";
import { createBoutPhysicalInput } from "../../../src/physics/createBoutPhysicalInput";

/** A shortened final authored interval reaches the actual requested endpoint on every body. One-, two-, four-, five- and six-tick clips cover both complete and partial coarse intervals at zero and nonzero archive offsets without integrating a world. */
export async function test_physical_bout_sampling(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const findings: string[] = [];
  for (const start of [0, 149])
    for (const ticks of [1, 2, 4, 5, 6]) {
      const duration: number = ticks / 120;
      const input: Simulation.IInput = createBoutPhysicalInput(
        source,
        duration,
        "simulated",
        start,
      );
      const observed: ReturnType<BoutTargetSource["sample"]> = source.sample(
        start + duration,
      );
      for (const actor of ["a", "b", "referee"] as const) {
        const body: Simulation.IBody = input.bodies.find(
          (candidate: Simulation.IBody): boolean => candidate.id === actor,
        )!;
        assert.equal(body.targets.length, ticks + 1);
        const expected: Record<string, P.ITransform> = projectPhysicalTargets(
          body.profile,
          observed[actor].segments,
        ).targets;
        const target: Simulation.ITarget = body.targets[ticks]!;
        for (const segment of body.profile.segments) {
          const actual: P.ITransform = target.segments[segment.bone]!;
          const endpoint: P.ITransform = expected[segment.bone]!;
          if (
            Vector3.length(
              Vector3.subtract(actual.position, endpoint.position),
            ) > 1e-10
          )
            findings.push(
              `${actor}/${segment.bone} endpoint@${start}+${ticks} ticks`,
            );
          for (const axis of [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
          ])
            if (
              Vector3.length(
                Vector3.subtract(
                  Quaternion.rotateVector(actual.rotation, axis),
                  Quaternion.rotateVector(endpoint.rotation, axis),
                ),
              ) > 1e-10
            )
              findings.push(
                `${actor}/${segment.bone} rotation@${start}+${ticks} ticks`,
              );
        }
      }
    }
  assert.deepEqual(findings, []);
}
