import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import { admitPhysicalBody } from "./admitPhysicalBody";
import { admitPhysicalReleasePolicy } from "./admitPhysicalReleasePolicy";
import { admitPhysicalTargets } from "./admitPhysicalTargets";
import { validatePhysicalProfile } from "./validatePhysicalProfile";

/**
 * Admit complete populations and raw and derived finite scalars before identity
 * or world allocation.
 */
export function admitPhysicalSimulation(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): void {
  const positive: (value: number) => boolean = (value: number): boolean =>
    Number.isFinite(value) && value > 0;
  const floor:
    | IAutoMoviePhysicalSimulationInput.IInput["floorBounds"]
    | undefined = input.floorBounds;
  if (
    !floor?.min ||
    !floor.max ||
    ![
      floor.min.x,
      floor.min.z,
      floor.max.x,
      floor.max.z,
      floor.thickness,
    ].every(Number.isFinite) ||
    !(floor.min.x < floor.max.x) ||
    !(floor.min.z < floor.max.z) ||
    ![
      floor.thickness / 2,
      (floor.max.x - floor.min.x) / 2,
      (floor.max.z - floor.min.z) / 2,
    ].every(positive)
  )
    throw new Error("Invalid finite physical floor bounds or thickness");
  if (
    !Number.isSafeInteger(input.substeps) ||
    input.substeps! < 1 ||
    input.substeps! > 128
  )
    throw new Error("Invalid substep count");

  if (!positive(input.contactTolerance!))
    throw new Error("Invalid contact tolerance");
  if (!positive(input.contactFrequency!))
    throw new Error("Invalid contact frequency");
  const count: number = input.duration * input.rate;
  if (!Number.isSafeInteger(count * input.substeps!))
    throw new Error("Substep clock exceeds its exact integer budget");
  if (
    !Number.isFinite(input.duration) ||
    input.duration <= 0 ||
    !Number.isSafeInteger(input.rate) ||
    input.rate <= 0 ||
    !Number.isSafeInteger(count) ||
    count > input.maximumSteps ||
    !Number.isSafeInteger(input.maximumSteps) ||
    input.maximumSteps <= 0 ||
    !Number.isSafeInteger(input.maximumSegments) ||
    input.maximumSegments <= 0 ||
    !Number.isSafeInteger(input.checkpointEvery) ||
    input.checkpointEvery <= 0 ||
    !Number.isSafeInteger(input.yieldEvery) ||
    input.yieldEvery <= 0 ||
    !Number.isFinite(input.floor) ||
    !input.gravity ||
    ![input.gravity.x, input.gravity.y, input.gravity.z].every(
      Number.isFinite,
    ) ||
    !Array.isArray(input.bodies) ||
    !Array.isArray(input.impulses)
  )
    throw new Error("Invalid fixed-step settings or work budget");
  if (
    !positive(1 / (input.rate * input.substeps!)) ||
    ![
      (floor.min.x + floor.max.x) / 2,
      input.floor - floor.thickness / 2,
      (floor.min.z + floor.max.z) / 2,
    ].every(Number.isFinite)
  )
    throw new Error("Derived timestep or floor placement is not finite");
  const ids: Set<string> = new Set();
  let segments: number = 0;
  for (const body of input.bodies) {
    if (
      !body ||
      typeof body.id !== "string" ||
      !body.id.trim() ||
      body.id.includes("/") ||
      body.id === "floor" ||
      ids.has(body.id)
    )
      throw new Error("Invalid physical body id");
    ids.add(body.id);
    const errors: string[] = validatePhysicalProfile(body.profile);
    if (errors.length) throw new Error(body.id + ": " + errors.join(", "));
    segments += body.profile.segments.length;
  }
  if (segments > input.maximumSegments)
    throw new Error("Simulation segment budget exceeded");
  for (const body of input.bodies) {
    admitPhysicalBody(input, body);
    admitPhysicalReleasePolicy(input, body);
    admitPhysicalTargets(input, body);
  }
  for (const impulse of input.impulses) {
    const body: IAutoMoviePhysicalSimulationInput.IBody | undefined =
      input.bodies.find(
        (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
          candidate.id === impulse?.body,
      );
    if (
      !impulse ||
      !body ||
      !Number.isInteger(impulse.step) ||
      impulse.step < 1 ||
      impulse.step > count ||
      !body.profile.segments.some(
        (
          segment: IAutoMoviePhysicalSimulationInput.IBody["profile"]["segments"][number],
        ): boolean => segment.bone === impulse.bone,
      ) ||
      !impulse.impulse ||
      !impulse.point ||
      ![
        impulse.impulse.x,
        impulse.impulse.y,
        impulse.impulse.z,
        impulse.point.x,
        impulse.point.y,
        impulse.point.z,
      ].every(Number.isFinite)
    )
      throw new Error("Invalid explicit impulse");
    const factor: number =
      body.mode.kind === "exaggerated" ? body.mode.impulse : 1;
    if (
      ![
        impulse.impulse.x * factor,
        impulse.impulse.y * factor,
        impulse.impulse.z * factor,
      ].every(Number.isFinite)
    )
      throw new Error("Scaled explicit impulse is not finite");
  }
}
