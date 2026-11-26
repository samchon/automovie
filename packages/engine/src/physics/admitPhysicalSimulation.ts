import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import { admitPhysicalBody } from "./admitPhysicalBody";
import { admitPhysicalReleasePolicy } from "./internal/admitPhysicalReleasePolicy";
import { admitPhysicalTargets } from "./admitPhysicalTargets";
import { validatePhysicalProfile } from "./internal/validatePhysicalProfile";

/**
 * Admit complete populations, floor dimensions and work budgets before identity
 * or world allocation.
 */
export function admitPhysicalSimulation(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): void {
  const floor: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"] =
    input.floorBounds;
  if (
    floor.min.x >= floor.max.x ||
    floor.min.z >= floor.max.z ||
    floor.thickness <= 0
  )
    throw new Error("Invalid physical floor bounds or thickness");
  if (input.substeps! < 1 || input.substeps! > 128)
    throw new Error("Invalid substep count");

  if (input.contactTolerance! <= 0)
    throw new Error("Invalid contact tolerance");
  if (input.contactFrequency! <= 0)
    throw new Error("Invalid contact frequency");
  const count: number = Math.round(input.duration * input.rate);
  if (
    input.duration <= 0 ||
    input.rate <= 0 ||
    count > input.maximumSteps ||
    input.maximumSteps <= 0 ||
    input.maximumSegments <= 0 ||
    input.checkpointEvery <= 0 ||
    input.yieldEvery <= 0
  )
    throw new Error("Invalid fixed-step settings or work budget");
  const ids: Set<string> = new Set();
  let segments: number = 0;
  for (const body of input.bodies) {
    if (
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
          candidate.id === impulse.body,
      );
    if (
      !body ||
      impulse.step < 1 ||
      impulse.step > count ||
      !body.profile.segments.some(
        (
          segment: IAutoMoviePhysicalSimulationInput.IBody["profile"]["segments"][number],
        ): boolean => segment.bone === impulse.bone,
      )
    )
      throw new Error("Invalid explicit impulse");
  }
}
