import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";

/** Resolve declared contact-triggered withdrawal from causal solver samples. Keep joint overrides for protective effort, and retain the transition in checkpoint-owned state. Geometric, future and zero-impulse observations cannot trigger release. */
export function samplePhysicalTrackingTarget(
  body: Simulation.IBody,
  target: Simulation.ITarget,
  contacts: readonly Receipt[],
  seconds: number,
  released: Set<string>,
): Simulation.ITarget {
  const policy: Simulation.IBody["releaseOnContact"] = body.releaseOnContact;
  if (!policy || body.mode.kind === "kinematic") return target;
  if (!released.has(body.id) && seconds >= policy.earliest) {
    const matches: (own: Receipt["a"], other: Receipt["a"]) => boolean = (
      own: Receipt["a"],
      other: Receipt["a"],
    ): boolean =>
      own.body === body.id &&
      policy.shapes.includes(own.shape) &&
      other.body === policy.otherBody &&
      policy.otherShapes.includes(other.shape);
    if (
      contacts.some(
        (receipt: Receipt): boolean =>
          receipt.source === "solver" &&
          (matches(receipt.a, receipt.b) || matches(receipt.b, receipt.a)) &&
          (receipt.samples
            ? receipt.samples.some(
                (sample: NonNullable<Receipt["samples"]>[number]): boolean =>
                  sample.seconds <= seconds &&
                  sample.seconds >= policy.earliest &&
                  sample.seconds <= policy.latest &&
                  sample.impulse > 0 &&
                  (sample.appliedImpulse?.[
                    receipt.a.body === body.id ? "a" : "b"
                  ] ?? sample.impulse) > 0 &&
                  sample.separation <= 0,
              )
            : receipt.seconds <= seconds &&
              receipt.seconds >= policy.earliest &&
              receipt.seconds <= policy.latest &&
              (receipt.impulse ?? 0) > 0 &&
              receipt.separation <= 0),
      )
    )
      released.add(body.id);
  }
  return released.has(body.id)
    ? {
        ...target,
        dynamicSegments: undefined,
        strength: 0,
        jointStrength: target.releasedJointStrength ?? target.jointStrength,
      }
    : target;
}
