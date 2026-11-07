import {
  AutoMoviePhysicalSimulation as Simulation,
  physicalShapeBounds,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { measurePhysicalJointLimits } from "../../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { createBoutPhysicalInput } from "../../src/physics/createBoutPhysicalInput";

/** Compare a declared native-quality matrix on the same actual support/kick targets, independently of opponent contact. Complete every setting before selecting one. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const rows: object[] = [];
  for (const start of [0, 149.25]) {
    const original: Simulation.IInput = createBoutPhysicalInput(
      source,
      1,
      "simulated",
      start,
    );
    original.bodies = original.bodies.filter(
      (body: Simulation.IBody): boolean => body.id !== "b",
    );
    for (const settings of [
      { iterations: 12, internalIterations: 1 },
      { iterations: 12, internalIterations: 4 },
      { iterations: 32, internalIterations: 4 },
      { iterations: 64, internalIterations: 16 },
    ]) {
      const input: Simulation.IInput = {
        ...structuredClone(original),
        ...settings,
      };
      const begun: number = performance.now();
      const run: Simulation = await Simulation.compute(input);
      let jointMaximum: number = 0;
      let floorMaximum: number = 0;
      let label: string = "";
      for (const frame of run.cache.frames)
        for (const body of input.bodies) {
          const states: (typeof frame.bodies)[string] = frame.bodies[body.id]!;
          for (const joint of body.profile.joints)
            for (const coordinate of measurePhysicalJointLimits(
              joint,
              states[joint.parent]!,
              states[joint.child]!,
            ))
              if (coordinate.violation > jointMaximum) {
                jointMaximum = coordinate.violation;
                label = `${body.id}/${joint.id}/${coordinate.axis}@${start + frame.seconds}`;
              }
          for (const segment of body.profile.segments)
            for (const shape of segment.shapes) {
              const compression: number =
                body.profile.materials.find(
                  (material: P.IMaterial): boolean =>
                    material.id === shape.material,
                )?.maximumCompression ?? 0;
              floorMaximum = Math.max(
                floorMaximum,
                input.floor -
                  physicalShapeBounds(states[segment.bone]!, shape).min.y -
                  compression,
              );
            }
        }
      const row: object = {
        start,
        ...settings,
        seconds: (performance.now() - begun) / 1000,
        jointMaximum,
        label,
        floorMaximum,
        recovery: Object.fromEntries(
          Object.entries(run.cache.recovery).map(
            ([id, state]: [string, (typeof run.cache.recovery)[string]]): [
              string,
              object,
            ] => [
              id,
              {
                state: state.last,
                steps: state.steps.length,
                landings: state.landings?.length ?? 0,
              },
            ],
          ),
        ),
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  const destination: string = path.resolve(
    ".cache/physical/quality-comparison.json",
  );
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(rows, null, 2));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
