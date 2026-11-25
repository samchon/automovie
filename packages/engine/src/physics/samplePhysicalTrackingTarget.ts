import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

/**
 * Resolve declared contact-triggered withdrawal from causal solver samples.
 * Keep joint overrides for protective effort, and retain the transition in
 * checkpoint-owned state. Geometric, future and zero-impulse observations
 * cannot trigger release.
 */
export function samplePhysicalTrackingTarget(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  contacts: readonly IAutoMovieContactReceipt[],
  seconds: number,
  released: Set<string>,
): IAutoMoviePhysicalSimulationInput.ITarget {
  const policy: IAutoMoviePhysicalSimulationInput.IBody["releaseOnContact"] =
    body.releaseOnContact;
  if (!policy || body.mode.kind === "kinematic") return target;
  if (!released.has(body.id) && seconds >= policy.earliest) {
    const matches: (
      own: IAutoMovieContactReceipt["a"],
      other: IAutoMovieContactReceipt["a"],
    ) => boolean = (
      own: IAutoMovieContactReceipt["a"],
      other: IAutoMovieContactReceipt["a"],
    ): boolean =>
      own.body === body.id &&
      policy.shapes.includes(own.shape) &&
      other.body === policy.otherBody &&
      policy.otherShapes.includes(other.shape);
    if (
      contacts.some(
        (receipt: IAutoMovieContactReceipt): boolean =>
          receipt.source === "solver" &&
          (matches(receipt.a, receipt.b) || matches(receipt.b, receipt.a)) &&
          (receipt.samples
            ? receipt.samples.some(
                (
                  sample: NonNullable<
                    IAutoMovieContactReceipt["samples"]
                  >[number],
                ): boolean =>
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
