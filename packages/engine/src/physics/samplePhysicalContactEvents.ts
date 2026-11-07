import type {
  IAutoMovieVector3,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/** Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority. */
export function samplePhysicalContactEvents(
  receipt: Receipt,
  seconds: number = Infinity,
): Receipt[] {
  const point: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(Number.isFinite);
  const normal: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean =>
    point(value) && Math.abs(Math.hypot(value.x, value.y, value.z) - 1) <= 1e-5;
  const identity: (value: Receipt["a"]) => boolean = (
    value: Receipt["a"],
  ): boolean =>
    !!value &&
    [value.body, value.bone, value.shape, value.material].every(
      (name: string): boolean => typeof name === "string" && !!name.trim(),
    );
  if (
    !receipt ||
    typeof receipt.id !== "string" ||
    !receipt.id.trim() ||
    !identity(receipt.a) ||
    !identity(receipt.b)
  )
    throw new Error("Invalid contact event identity");
  if (
    !(seconds >= 0) ||
    (seconds !== Infinity && !Number.isFinite(seconds)) ||
    !receipt ||
    !["solver", "geometric"].includes(receipt.source) ||
    !Number.isFinite(receipt.seconds) ||
    receipt.seconds < 0 ||
    !Number.isFinite(receipt.endSeconds) ||
    receipt.endSeconds < receipt.seconds ||
    !point(receipt.point) ||
    !normal(receipt.normal) ||
    !Number.isFinite(receipt.separation) ||
    receipt.separation > 0 ||
    !Number.isFinite(receipt.compression) ||
    receipt.compression < 0
  )
    throw new Error("Invalid causal contact event");
  if (receipt.source === "geometric") {
    if (
      receipt.impulse !== null ||
      (receipt.samples !== undefined &&
        (!Array.isArray(receipt.samples) || receipt.samples.length > 0))
    )
      throw new Error("Geometric contact cannot assert solved impulses");
    return receipt.seconds <= seconds ? [receipt] : [];
  }
  if (!Number.isFinite(receipt.impulse) || receipt.impulse! < 0)
    throw new Error("Invalid solver contact impulse");
  if (receipt.samples === undefined)
    return receipt.seconds <= seconds ? [receipt] : [];
  if (!Array.isArray(receipt.samples))
    throw new Error("Invalid completed contact samples");
  const events: Receipt[] = [];
  let previous: number = receipt.seconds;
  for (const sample of receipt.samples) {
    if (
      !sample ||
      !Number.isFinite(sample.seconds) ||
      sample.seconds < previous ||
      sample.seconds > receipt.endSeconds ||
      !(sample.duration > 0) ||
      !Number.isFinite(sample.duration) ||
      !Number.isFinite(sample.impulse) ||
      sample.impulse < 0 ||
      (sample.appliedImpulse !== undefined &&
        (!isAutoMovieRecord(sample.appliedImpulse) ||
          ![sample.appliedImpulse.a, sample.appliedImpulse.b].every(
            (impulse: number): boolean =>
              Number.isFinite(impulse) && impulse >= 0,
          ))) ||
      !point(sample.point) ||
      !normal(sample.normal) ||
      !Number.isFinite(sample.separation) ||
      sample.separation > 0 ||
      !Number.isFinite(sample.compression) ||
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
