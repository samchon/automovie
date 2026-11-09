import type {
  IAutoMovieVector3,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/**
 * Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit causal contact quantities and flatten completed solver samples without promoting geometry to impulse authority) directly over its typed inputs (`receipt`, `seconds`) as nested iteration of depth 2 (every over [value.x, value.y, value.z]; every over [value.body, value.bone, value.shape, va; for-of over receipt.samples), delegating to `point`, `Math.abs`, `Math.hypot`, `name.trim`, `identity`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (6 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 92 lines and 13 top-level statements that reuses `point`, `Math.abs`, `Math.hypot`, `name.trim`, `identity` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `receipt`, `seconds`; the dominant cost is nested iteration of depth 2 (every over [value.x, value.y, value.z]; every over [value.body, value.bone, value.shape, va; for-of over receipt.samples), performed once per call with 16 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 16 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
