import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "./PhysicalFixtures";
import { PhysicalPerformanceFixtures } from "./PhysicalPerformanceFixtures";

/** Measure head and trunk momentum response and recovery within the explicitly declared compliance interval. */
export async function measurePhysicalHumanImpulse(
  profile: P,
): Promise<IObservation[]> {
  const observations: IObservation[] = [];
  for (const impulse of [2, 4])
    for (const strength of [0.2, 1]) {
      const body: Simulation.IBody = PhysicalPerformanceFixtures.trackedBody(
        profile,
        2,
      );
      body.complianceSeconds = 0.8;
      body.complianceStrength = strength;
      const input: Simulation.IInput = PhysicalFixtures.input([body], 2);
      input.substeps = 32;
      const head: P.ISegment = profile.segments.find(
        (segment: (typeof profile.segments)[number]): boolean =>
          segment.bone === "head",
      )!;
      input.impulses.push({
        step: 60,
        body: body.id,
        bone: "head",
        impulse: { x: impulse, y: 0, z: 0 },
        point: Vector3.add(
          head.neutral.position,
          Quaternion.rotateVector(head.neutral.rotation, head.centerOfMass),
        ),
      });
      const run: Simulation = await Simulation.compute(input);
      const measurements: IObservation["measurements"] = ["head", "chest"].map(
        (bone: string): IObservation["measurements"][number] => {
          const target: P.ITransform = body.targets[0]!.segments[bone]!;
          const errors: number[] = run.cache.frames.map(
            (frame: (typeof run.cache.frames)[number]): number =>
              Vector3.length(
                Vector3.subtract(
                  frame.bodies[body.id]![bone]!.position,
                  target.position,
                ),
              ),
          );
          return {
            bone,
            peak: Math.max(...errors.slice(60, 157)),
            atWindowEnd: errors[156]!,
            final: errors.at(-1)!,
          };
        },
      );
      const observation: IObservation = {
        impulse,
        strength,
        measurements,
        saturationRows: run.tracking.length,
      };
      observations.push(observation);
      console.log(JSON.stringify(observation));
    }
  return observations;
}

/** Complete measured outcomes retained before the calling test asserts any case. */
interface IObservation {
  /** Applied head momentum, newton seconds. */ impulse: number;
  /** Struck segment's temporary actuator fraction. */ strength: number;
  /** Actual world-origin displacement from the authored pose, metres. */ measurements: {
    bone: string;
    peak: number;
    atWindowEnd: number;
    final: number;
  }[];
  /** Forecast rows where an actuator exceeded its declared demand budget. */ saturationRows: number;
}
