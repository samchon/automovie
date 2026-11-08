import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicalSimulationInput } from "./AutoMoviePhysicalSimulationInput";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Dense authored-relative joint errors at any cached film second, without retaining film-sized diagnostics.
 * Error is the shortest relative-rotation distance in radians. Recovery retargets
 * can intentionally depart from the original authored hint. Saturation entries
 * remain the most recent completed step's pre-solve demand forecasts, never a
 * claim to a native motor impulse that the pinned SDK does not expose.
 */
export function samplePhysicalTracking(
  input: Simulation.IInput,
  cache: Cache,
  diagnostics: readonly Simulation.IDiagnostic[],
  seconds: number,
): Simulation.IDiagnostic[] {
  const frame: Cache.IFrame = cache.at(seconds);
  const sample: number = seconds * input.rate;
  const before: number = Math.floor(sample);
  const after: number = Math.ceil(sample);
  const completed: number = before / input.rate;
  const forecasts: Map<string, Simulation.IDiagnostic["saturated"]> = new Map(
    diagnostics
      .filter(
        (entry: (typeof diagnostics)[number]): boolean =>
          entry.seconds === completed,
      )
      .map(
        (
          entry: AutoMoviePhysicalSimulationInput.IDiagnostic,
        ): [string, Simulation.IDiagnostic["saturated"]] => [
          JSON.stringify([entry.body, entry.joint]),
          entry.saturated,
        ],
      ),
  );
  const result: Simulation.IDiagnostic[] = [];
  for (const body of input.bodies) {
    const goals: Record<string, P.ITransform> = Object.fromEntries(
      body.profile.segments.map(
        (
          segment: (typeof body.profile.segments)[number],
        ): [string, P.ITransform] => [
          segment.bone,
          samplePhysicalTarget(
            body.targets[before]!.segments[segment.bone]!,
            body.targets[after]!.segments[segment.bone]!,
            sample - before,
            input.rate,
          ).pose,
        ],
      ),
    );
    for (const joint of body.profile.joints) {
      const relative: (
        poses: Readonly<Record<string, P.ITransform>>,
      ) => P.ITransform["rotation"] = (
        poses: Readonly<Record<string, P.ITransform>>,
      ): P.ITransform["rotation"] =>
        Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              poses[joint.parent]!.rotation,
              joint.parentFrame.rotation,
            ),
          ),
          Quaternion.multiply(
            poses[joint.child]!.rotation,
            joint.childFrame.rotation,
          ),
        );
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        relative(goals),
        Quaternion.inverse(relative(frame.bodies[body.id]!)),
      );
      const error: number =
        2 *
        Math.atan2(Math.hypot(delta.x, delta.y, delta.z), Math.abs(delta.w));
      const saturated: Simulation.IDiagnostic["saturated"] =
        forecasts.get(JSON.stringify([body.id, joint.id])) ?? [];
      result.push({
        seconds,
        body: body.id,
        joint: joint.id,
        error,
        saturated: [...saturated],
      });
    }
  }
  return result;
}
