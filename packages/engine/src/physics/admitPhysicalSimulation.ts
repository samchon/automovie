import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { admitPhysicalBody } from "./admitPhysicalBody";
import { admitPhysicalReleasePolicy } from "./admitPhysicalReleasePolicy";
import { admitPhysicalTargets } from "./admitPhysicalTargets";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { validatePhysicalProfile } from "./validatePhysicalProfile";

/** Admit complete populations and raw/derived native scalars before identity or world allocation. */
export function admitPhysicalSimulation(input: Simulation.IInput): void {
  const positive: (value: number) => boolean = (value: number): boolean =>
    scalar(value) && Math.fround(value) > 0;
  const floor: Simulation.IInput["floorBounds"] | undefined = input.floorBounds;
  if (
    !floor?.min ||
    !floor.max ||
    ![
      floor.min.x,
      floor.min.z,
      floor.max.x,
      floor.max.z,
      floor.thickness,
    ].every(scalar) ||
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
    throw new Error("Invalid native substep count");
  if (
    !Number.isSafeInteger(input.internalIterations) ||
    input.internalIterations! < 1 ||
    input.internalIterations! > 128
  )
    throw new Error("Invalid native internal constraint iteration count");
  if (!positive(input.contactTolerance!))
    throw new Error("Invalid native contact tolerance");
  if (!positive(input.contactFrequency!))
    throw new Error("Invalid native contact frequency");
  const count: number = input.duration * input.rate;
  if (!Number.isSafeInteger(count * input.substeps!))
    throw new Error("Native tick clock exceeds its exact integer budget");
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
    !Number.isSafeInteger(input.iterations) ||
    input.iterations <= 0 ||
    input.iterations > 0xffffffff ||
    !scalar(input.floor) ||
    !input.gravity ||
    ![input.gravity.x, input.gravity.y, input.gravity.z].every(scalar) ||
    !Array.isArray(input.bodies) ||
    !Array.isArray(input.impulses)
  )
    throw new Error("Invalid native fixed-step settings or work budget");
  if (
    !positive(1 / (input.rate * input.substeps!)) ||
    ![
      (floor.min.x + floor.max.x) / 2,
      input.floor - floor.thickness / 2,
      (floor.min.z + floor.max.z) / 2,
    ].every(scalar)
  )
    throw new Error(
      "Derived native timestep or floor placement exceeds f32 range",
    );
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
    const body: Simulation.IBody | undefined = input.bodies.find(
      (candidate: Simulation.IBody): boolean => candidate.id === impulse?.body,
    );
    if (
      !impulse ||
      !body ||
      !Number.isInteger(impulse.step) ||
      impulse.step < 1 ||
      impulse.step > count ||
      !body.profile.segments.some(
        (segment: Simulation.IBody["profile"]["segments"][number]): boolean =>
          segment.bone === impulse.bone,
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
      ].every(scalar)
    )
      throw new Error("Invalid native explicit impulse");
    const factor: number =
      body.mode.kind === "exaggerated" ? body.mode.impulse : 1;
    if (
      ![
        impulse.impulse.x * factor,
        impulse.impulse.y * factor,
        impulse.impulse.z * factor,
      ].every(scalar)
    )
      throw new Error("Scaled explicit impulse exceeds f32 range");
  }
}
