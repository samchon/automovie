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
