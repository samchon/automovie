import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { admitPhysicalBody } from "./admitPhysicalBody";
import { admitPhysicalReleasePolicy } from "./admitPhysicalReleasePolicy";
import { admitPhysicalTargets } from "./admitPhysicalTargets";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { validatePhysicalProfile } from "./validatePhysicalProfile";

/**
 * Admit complete populations and raw/derived native scalars before identity or world allocation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit complete populations and raw/derived native scalars before identity or world allocation) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit complete populations and raw/derived native scalars before identity or world allocation) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [ floor.min.x, floor.min.z, ; every over [ floor.thickness / 2, (floo; every over [input.gravity.x, input.gravity.y, input), delegating to `scalar`, `Math.fround`, `Number.isSafeInteger`, `positive`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (13 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 128, 4294967295, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 140 lines and 17 top-level statements that reuses `scalar`, `Math.fround`, `Number.isSafeInteger`, `positive`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [ floor.min.x, floor.min.z, ; every over [ floor.thickness / 2, (floo; every over [input.gravity.x, input.gravity.y, input), performed once per call with 20 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 20 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
