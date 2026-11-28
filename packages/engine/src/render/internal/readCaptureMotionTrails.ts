import type { IAutoMovieInspectionTrail } from "@automovie/interface";

/*
 * Draw samples at most 1,201 times across 64 selected paths. A remount can
 * split a path into many segments without increasing that total.
 */
const MAXIMUM_TIMES: number = 1_201;
const MAXIMUM_PATHS: number = 64;
const MAXIMUM_SAMPLES: number = MAXIMUM_TIMES * MAXIMUM_PATHS;

/* Admit only complete source-backed numeric traces from a stored still row. */
export function readCaptureMotionTrails(
  value: unknown,
  isTime: (value: unknown) => boolean,
): value is readonly IAutoMovieInspectionTrail[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAXIMUM_SAMPLES
  )
    return false;
  const pathCounts: Map<string, number> = new Map();
  for (const item of value) {
    const trail = fieldsOf(item);
    if (
      trail === undefined ||
      typeof trail.path !== "string" ||
      typeof trail.stationary !== "boolean" ||
      !Array.isArray(trail.times) ||
      trail.times.length === 0 ||
      trail.times.length > MAXIMUM_TIMES ||
      !Array.isArray(trail.positions) ||
      trail.positions.length !== trail.times.length * 3 ||
      !trail.positions.every(Number.isFinite)
    )
      return false;
    const count: number =
      (pathCounts.get(trail.path) ?? 0) + trail.times.length;
    if (count > MAXIMUM_TIMES) return false;
    pathCounts.set(trail.path, count);
    if (pathCounts.size > MAXIMUM_PATHS) return false;

    const motion = fieldsOf(trail.motion);
    if (
      motion === undefined ||
      !Array.isArray(motion.samples) ||
      motion.samples.length !== trail.times.length ||
      (motion.route !== undefined && !isRoute(motion.route))
    )
      return false;
    let previous: number = 0;
    for (let i: number = 0; i < trail.times.length; ++i) {
      const seconds: unknown = trail.times[i];
      const sample = fieldsOf(motion.samples[i]);
      if (
        typeof seconds !== "number" ||
        !Number.isFinite(seconds) ||
        seconds < previous ||
        sample === undefined ||
        !isTime(sample.time) ||
        fieldsOf(sample.time)?.filmSeconds !== seconds ||
        !isMotionSample(sample, motion.route !== undefined)
      )
        return false;
      previous = seconds;
    }
  }
  return true;
}

type IFields = Readonly<Record<string, unknown>>;

function fieldsOf(value: unknown): IFields | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as IFields)
    : undefined;
}

function isPoint(value: unknown): boolean {
  const point = fieldsOf(value);
  return (
    point !== undefined &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

function isRoute(value: unknown): boolean {
  const route = fieldsOf(value);
  return (
    route !== undefined &&
    typeof route.id === "string" &&
    route.id.trim() !== "" &&
    Array.isArray(route.points) &&
    route.points.length >= 2 &&
    route.points.length <= MAXIMUM_TIMES &&
    route.points.every(isPoint) &&
    typeof route.requestedSpeed === "number" &&
    Number.isFinite(route.requestedSpeed) &&
    route.requestedSpeed > 0 &&
    typeof route.effectiveSpeed === "number" &&
    Number.isFinite(route.effectiveSpeed) &&
    route.effectiveSpeed > 0
  );
}

function isBaseline(value: unknown): boolean {
  const frame = fieldsOf(value);
  return (
    frame !== undefined &&
    Number.isFinite(frame.time) &&
    Number.isFinite(frame.yawDeg) &&
    isPoint(frame.position) &&
    isPoint(frame.tangent)
  );
}

function isProjection(value: unknown): boolean {
  const projection = fieldsOf(value);
  if (projection === undefined) return false;
  if (projection.status === "behind" || projection.status === "unprojectable")
    return projection.ndc === undefined;
  return (
    (projection.status === "in-frame" ||
      projection.status === "outside" ||
      projection.status === "depth-clipped") &&
    isPoint(projection.ndc)
  );
}

function isSupport(value: unknown): boolean {
  const support = fieldsOf(value);
  if (support === undefined) return false;
  return (
    support.status === "unavailable" ||
    (support.status === "observed" &&
      typeof support.path === "string" &&
      isPoint(support.local) &&
      Number.isFinite(support.gap) &&
      typeof support.slip === "number" &&
      Number.isFinite(support.slip) &&
      support.slip >= 0)
  );
}

function isMotionSample(sample: IFields, routed: boolean): boolean {
  return (
    (sample.entry === null ||
      (typeof sample.entry === "number" &&
        Number.isSafeInteger(sample.entry) &&
        sample.entry >= 0)) &&
    (sample.baseline === undefined ||
      (routed && isBaseline(sample.baseline))) &&
    (sample.phase === undefined ||
      (typeof sample.phase === "number" &&
        sample.phase >= 0 &&
        sample.phase < 1)) &&
    (sample.forward === undefined || isPoint(sample.forward)) &&
    isProjection(sample.projection) &&
    (sample.support === undefined || isSupport(sample.support))
  );
}
