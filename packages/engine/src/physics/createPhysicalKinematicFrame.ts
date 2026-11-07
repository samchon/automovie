import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Authored state remains first-class and uses finite differences only for reported velocities. */
export function createPhysicalKinematicFrame(
  input: AutoMoviePhysicalSimulation.IInput,
  step: number,
): Cache.IFrame {
  const bodies: Cache.IFrame["bodies"] = Object.create(null);
  for (const body of input.bodies) {
    bodies[body.id] = Object.create(null);
    for (const segment of body.profile.segments) {
      const pose: P.ITransform = body.targets[step]!.segments[segment.bone]!;
      const before: P.ITransform =
        body.targets[Math.max(0, step - 1)]!.segments[segment.bone]!;
      bodies[body.id]![segment.bone] = {
        ...structuredClone(pose),
        velocity: Vector3.scale(
          Vector3.subtract(pose.position, before.position),
          step === 0 ? 0 : input.rate,
        ),
        angularVelocity:
          step === 0
            ? { x: 0, y: 0, z: 0 }
            : samplePhysicalTarget(before, pose, 1, input.rate).angularVelocity,
      };
    }
  }
  return { seconds: step / input.rate, bodies };
}
