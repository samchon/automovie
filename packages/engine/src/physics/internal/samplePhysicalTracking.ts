import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicsCache,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { samplePhysicalTarget } from "../samplePhysicalTarget";

/**
 * Dense authored-relative joint errors at any cached film second, without
 * retaining film-sized diagnostics. Error is the shortest relative-rotation
 * distance in radians. Recovery retargets can intentionally depart from the
 * original authored hint. Saturation entries remain the most recent completed
 * step's pre-solve demand forecasts, never a claim to a native motor impulse
 * that the pinned SDK does not expose.
 */
export function samplePhysicalTracking(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  cache: IAutoMoviePhysicsCache,
  diagnostics: readonly IAutoMoviePhysicalSimulationInput.IDiagnostic[],
  seconds: number,
): IAutoMoviePhysicalSimulationInput.IDiagnostic[] {
  const frame: IAutoMoviePhysicalFrame = cache.at(seconds);
  const sample: number = seconds * input.rate;
  const before: number = Math.floor(sample);
  const after: number = Math.ceil(sample);
  const completed: number = before / input.rate;
  const forecasts: Map<
    string,
    IAutoMoviePhysicalSimulationInput.IDiagnostic["saturated"]
  > = new Map(
    diagnostics
      .filter(
        (entry: (typeof diagnostics)[number]): boolean =>
          entry.seconds === completed,
      )
      .map(
        (
          entry: IAutoMoviePhysicalSimulationInput.IDiagnostic,
        ): [
          string,
          IAutoMoviePhysicalSimulationInput.IDiagnostic["saturated"],
        ] => [JSON.stringify([entry.body, entry.joint]), entry.saturated],
      ),
  );
  const result: IAutoMoviePhysicalSimulationInput.IDiagnostic[] = [];
  for (const body of input.bodies) {
    const goals: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
      body.profile.segments.map(
        (
          segment: (typeof body.profile.segments)[number],
        ): [string, IAutoMovieRigidTransform] => [
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
        poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
      ) => IAutoMovieRigidTransform["rotation"] = (
        poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
      ): IAutoMovieRigidTransform["rotation"] =>
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
      const delta: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
        relative(goals),
        Quaternion.inverse(relative(frame.bodies[body.id]!)),
      );
      const error: number =
        2 *
        Math.atan2(Math.hypot(delta.x, delta.y, delta.z), Math.abs(delta.w));
      const saturated: IAutoMoviePhysicalSimulationInput.IDiagnostic["saturated"] =
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
