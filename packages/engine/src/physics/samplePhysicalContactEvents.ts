import type {
  IAutoMovieContactReceipt,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Admit causal contact quantities and flatten completed solver samples without
 * promoting geometry to impulse authority.
 */
export function samplePhysicalContactEvents(
  receipt: IAutoMovieContactReceipt,
  seconds: number = Infinity,
): IAutoMovieContactReceipt[] {
  const normal: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => Math.abs(Math.hypot(value.x, value.y, value.z) - 1) <= 1e-5;
  const identity: (value: IAutoMovieContactReceipt["a"]) => boolean = (
    value: IAutoMovieContactReceipt["a"],
  ): boolean =>
    [value.body, value.bone, value.shape, value.material].every(
      (name: string): boolean => !!name.trim(),
    );
  if (!receipt.id.trim() || !identity(receipt.a) || !identity(receipt.b))
    throw new Error("Invalid contact event identity");
  if (
    seconds < 0 ||
    receipt.seconds < 0 ||
    receipt.endSeconds < receipt.seconds ||
    !normal(receipt.normal) ||
    receipt.separation > 0 ||
    receipt.compression < 0
  )
    throw new Error("Invalid causal contact event");
  if (receipt.source === "geometric") {
    if (
      receipt.impulse !== null ||
      (receipt.samples !== undefined && receipt.samples.length > 0)
    )
      throw new Error("Geometric contact cannot assert solved impulses");
    return receipt.seconds <= seconds ? [receipt] : [];
  }
  if (receipt.impulse === null || receipt.impulse < 0)
    throw new Error("Invalid solver contact impulse");
  if (receipt.samples === undefined)
    return receipt.seconds <= seconds ? [receipt] : [];
  const events: IAutoMovieContactReceipt[] = [];
  let previous: number = receipt.seconds;
  for (const sample of receipt.samples) {
    if (
      sample.seconds < previous ||
      sample.seconds > receipt.endSeconds ||
      sample.duration <= 0 ||
      sample.impulse < 0 ||
      (sample.appliedImpulse !== undefined &&
        (sample.appliedImpulse.a < 0 || sample.appliedImpulse.b < 0)) ||
      !normal(sample.normal) ||
      sample.separation > 0 ||
      sample.compression < 0
    )
      throw new Error("Invalid completed contact sample");
    previous = sample.seconds;
    if (sample.seconds <= seconds)
      events.push({
        ...receipt,
        ...sample,
        endSeconds: sample.seconds,
        samples: undefined,
      });
  }
  return events;
}
