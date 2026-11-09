import type {
  IAutoMovieContactReceipt,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { samplePhysicalContactEvents } from "./samplePhysicalContactEvents";

/**
 * Local accumulating appearance weight at an actual provider surface point.
 * Provider-owned colour/roughness channels consume this scalar. Each contact
 * centre is supplied in the same current provider frame as the sample, so skin
 * marks follow the struck region through later articulation. Engine does not
 * choose a whole-part tint or assert a medical bruise model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Local accumulating appearance weight at an actual provider surface point) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Local accumulating appearance weight at an actual provider surface point) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.contacts; for-of over events), delegating to `Number.isFinite`, `samplePhysicalContactEvents`, `Vector3.length`, `Vector3.subtract`, `input.center`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 41 lines and 4 top-level statements that reuses `Number.isFinite`, `samplePhysicalContactEvents`, `Vector3.length`, `Vector3.subtract`, `input.center` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.contacts; for-of over events), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function sampleContactSurfaceResponse(input: {
  /** Actual receipts for this provider body. */
  contacts: readonly IAutoMovieContactReceipt[];
  /** Film second being drawn. */
  seconds: number;
  /** Surface sample in the provider's selected metre frame. */
  point: IAutoMovieVector3;
  /** Contact centre transported into that same frame. */
  center: (receipt: IAutoMovieContactReceipt) => IAutoMovieVector3;
  /** Explicit appearance radius, metres. */
  radius: number;
  /** Accumulation weight per N s. */
  weightPerImpulse: number;
  /** Positive decay time, seconds; Infinity retains marks. */
  decaySeconds: number;
  /** Formula-derived N s for geometric contacts. */
  geometricImpulses: Readonly<Record<string, number>>;
}): number {
  if (
    !Number.isFinite(input.seconds) ||
    input.seconds < 0 ||
    !(input.radius > 0) ||
    !Number.isFinite(input.radius) ||
    !(input.weightPerImpulse >= 0) ||
    !Number.isFinite(input.weightPerImpulse) ||
    !(input.decaySeconds > 0)
  )
    throw new Error("Invalid contact surface response time, radius or weights");
  let weight: number = 0;
  for (const receipt of input.contacts) {
    const events: IAutoMovieContactReceipt[] = samplePhysicalContactEvents(
      receipt,
      input.seconds,
    );
    for (const event of events) {
      const impulse: number | undefined =
        event.source === "solver"
          ? event.impulse!
          : input.geometricImpulses[receipt.id];
      if (impulse === undefined || !Number.isFinite(impulse) || impulse < 0)
        throw new Error(
          `Surface response requires an impulse for ${receipt.id}`,
        );
      const distance: number = Vector3.length(
        Vector3.subtract(input.point, input.center(event)),
      );
      if (distance >= input.radius) continue;
      const radius: number = distance / input.radius;
      const localized: number = (1 - radius * radius) ** 2;
      weight +=
        impulse *
        input.weightPerImpulse *
        localized *
        Math.exp(-(input.seconds - event.seconds) / input.decaySeconds);
    }
  }
  return Math.min(1, weight);
}
