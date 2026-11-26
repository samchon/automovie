import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import type { IAutoMovieCliReviewObservation } from "../IAutoMovieCliReviewObservation";

/**
 * Admits one stored review receipt with matching requested and observed scope.
 * A still decision covers a single decoded frame when timing is established.
 */
export function readAutoMovieReviewObservation(
  value: unknown,
): IAutoMovieCliReviewObservation {
  if (!record(value) || !admitted(value))
    throw new Error("Invalid file review receipt");
  if (
    value.viewed === "still" &&
    (value.observed === null
      ? value.requested.to !== null
      : value.observed.endFrame - value.observed.firstFrame !== 1)
  )
    throw new Error("Invalid file review receipt: a still selects one frame");
  return value;
}

/** A decoded JSON object. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Nonempty text remains distinguishable from an absent value. */
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** An index in a nonnegative output frame grid. */
function index(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** An explicitly requested film second. */
function second(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** An exact timestamp with two positive rational clock terms. */
function timestamp(
  value: unknown,
): value is IAutoMovieDeliveryContentAudit.ITimestamp {
  return (
    record(value) &&
    Number.isSafeInteger(value.ticks) &&
    Array.isArray(value.timeBase) &&
    value.timeBase.length === 2 &&
    value.timeBase.every((term: unknown): boolean => index(term) && term > 0)
  );
}

/** Validates the receipt's selected frame bounds and consistent native clock. */
function observed(
  value: unknown,
  from: number,
  to: number | null,
): value is NonNullable<IAutoMovieCliReviewObservation["observed"]> {
  if (
    !record(value) ||
    !index(value.firstFrame) ||
    !index(value.endFrame) ||
    !index(value.frameCount) ||
    value.firstFrame >= value.endFrame ||
    value.endFrame > value.frameCount ||
    !timestamp(value.start) ||
    !timestamp(value.end) ||
    value.start.timeBase[0] !== value.end.timeBase[0] ||
    value.start.timeBase[1] !== value.end.timeBase[1] ||
    value.start.ticks < 0 ||
    value.end.ticks <= value.start.ticks
  )
    return false;
  const ticks: number = value.end.ticks - value.start.ticks;
  const frames: number = value.endFrame - value.firstFrame;
  const stride: number = ticks / frames;
  const [numerator, denominator] = value.start.timeBase;
  const start: number = (value.start.ticks * numerator) / denominator;
  const afterFirst: number =
    ((value.start.ticks + stride) * numerator) / denominator;
  const beforeEnd: number =
    ((value.end.ticks - stride) * numerator) / denominator;
  const end: number = (value.end.ticks * numerator) / denominator;
  return (
    Number.isSafeInteger(stride) &&
    BigInt(value.start.ticks) === BigInt(value.firstFrame) * BigInt(stride) &&
    start <= from &&
    from < afterFirst &&
    (to === null ? frames === 1 : beforeEnd < to && to <= end)
  );
}

/** An assigned occurrence or an explicit limit on assignment. */
function cut(value: unknown): value is IAutoMovieCliReviewObservation["cut"] {
  return (
    record(value) &&
    (value.state === "resolved"
      ? index(value.entry) && text(value.shot)
      : (value.state === "ambiguous" || value.state === "unavailable") &&
        text(value.reason))
  );
}

/** The input shape and cross-field admission of a stored mark. */
function admitted(
  value: Record<string, unknown>,
): value is Record<string, unknown> & IAutoMovieCliReviewObservation {
  if (
    value.version !== 1 ||
    !text(value.subject) ||
    !text(value.file) ||
    typeof value.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(value.sha256) ||
    !text(value.note) ||
    !(value.previous === null || text(value.previous)) ||
    !record(value.requested) ||
    !second(value.requested.from) ||
    !(
      value.requested.to === null ||
      (second(value.requested.to) && value.requested.to > value.requested.from)
    ) ||
    !cut(value.cut)
  )
    return false;
  if (
    !(
      (value.reviewer === null &&
        value.decision === null &&
        value.viewed === null) ||
      (text(value.reviewer) &&
        (value.decision === "accepted" || value.decision === "needs-repair") &&
        (value.viewed === "still" ||
          (value.requested.to !== null &&
            (value.viewed === "playback" || value.viewed === "listening"))))
    )
  )
    return false;
  return value.observed === null
    ? text(value.unavailable) && value.cut.state === "unavailable"
    : value.unavailable === null &&
        observed(value.observed, value.requested.from, value.requested.to);
}
