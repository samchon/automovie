// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/captureRegion/OneStepCaptureRegionCalculator.java,
// calculateReachableRegions l.102-123 and calculateCaptureRegion l.139-235;
// captureRegion/CaptureRegionMathTools.java l.17-102.
import { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";


function computeRegion(input: {
  support: "left" | "right";
  remaining: number;
  capture: Polygon.IPoint;
  omega: number;
  foot: readonly Polygon.IPoint[];
  footWidth: number;
  range: number;
}): Polygon.IPoint[] {
  const reachable: Polygon.IPoint[] = AutoMovieEnginePhysicalOneStepCaptureRegion.reachable(
    input.support,
    input.footWidth,
    input.range,
  );
  const raw: Polygon.IPoint[] | undefined = AutoMovieEnginePhysicalOneStepCaptureRegion.raw(
    input,
  );
  if (raw === undefined) return reachable;
  if (raw.length === 0) return [];

  // 3. The raw region intersected with the reachable region (l.220-231).
  return Polygon.intersect(raw, reachable);
}

/**
 * Steps 1 and 2: the raw region before the reachable cut, the hull of the
 * predicted capture points and the far circle's points; undefined when the
 * capture point lies inside the support (l.165-175), empty when a ray misses
 * the circle.
 */
function rawRegion(input: {
  remaining: number;
  capture: Polygon.IPoint;
  omega: number;
  foot: readonly Polygon.IPoint[];
  range: number;
}): Polygon.IPoint[] | undefined {
  // 1. The capture point inside the support foot: the whole reachable region
  // (l.165-175).
  const remaining: number = Math.max(0, input.remaining);
  const centroid: Polygon.IPoint = Polygon.centroid(input.foot);
  const extremes: Polygon.IPoint[] | undefined = Polygon.visible(
    input.foot,
    input.capture,
  );
  if (!extremes) return undefined;

  // 2. Each extreme's predicted capture point and its ray's point on the
  // far circle (l.177-209; CaptureRegionMathTools l.17-71).
  const radius: number =
    AutoMovieEnginePhysicalOneStepCaptureRegion.APPROXIMATION_MULTIPLIER * input.range;
  const raw: Polygon.IPoint[] = [];
  let first: Polygon.IPoint = { x: 0, y: 0 };
  let last: Polygon.IPoint = { x: 0, y: 0 };
  const growth: number = Math.exp(input.omega * remaining);
  for (let i: number = 0; i < extremes.length; i++) {
    const cop: Polygon.IPoint = extremes[i]!;
    const predicted: Polygon.IPoint = {
      x: (input.capture.x - cop.x) * growth + cop.x,
      y: (input.capture.y - cop.y) * growth + cop.y,
    };
    raw.push(predicted);
    const extreme: Polygon.IPoint | undefined = ray(
      centroid,
      predicted,
      { x: predicted.x - cop.x, y: predicted.y - cop.y },
      radius,
    );
    if (!extreme) return [];
    raw.push(extreme);
    const direction: Polygon.IPoint = {
      x: extreme.x - centroid.x,
      y: extreme.y - centroid.y,
    };
    if (i === 0) first = direction;
    else last = direction;
  }

  // The circle's points between the first and last directions, turning from
  // the first clockwise by the angle between them (l.211-218;
  // CaptureRegionMathTools l.77-102).
  const between: number = Math.abs(
    Math.atan2(
      first.x * last.y - first.y * last.x,
      first.x * last.x + first.y * last.y,
    ),
  );
  const span: number = Math.hypot(first.x, first.y);
  for (
    let i: number = 0;
    i < AutoMovieEnginePhysicalOneStepCaptureRegion.KINEMATIC_LIMIT_POINTS - 1;
    i++
  ) {
    const alpha: number =
      (i + 1) / (AutoMovieEnginePhysicalOneStepCaptureRegion.KINEMATIC_LIMIT_POINTS + 1);
    const angle: number = between * alpha;
    const cos: number = Math.cos(angle);
    const sin: number = Math.sin(angle);
    raw.push({
      x: centroid.x + ((first.x * cos + first.y * sin) / span) * radius,
      y: centroid.y + ((-first.x * sin + first.y * cos) / span) * radius,
    });
  }

  return Polygon.hull(raw);
}

/** The capture region's reachable region and constants.
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/captureRegion/OneStepCaptureRegionCalculator.java
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/captureRegion/CaptureRegionMathTools.java
 */
export namespace AutoMovieEnginePhysicalOneStepCaptureRegion {
  /**
   * The one-step capture region of a support foot: where a swing foot can land
   * within its reach so that the capture point, diverging about the support
   * foot's centre of pressure for the swing time left, lies inside it (Koolen et
   * al. 2012, "Capturability-based analysis and control of legged locomotion,
   * Part 2"; IHMC 201903).
   *
   * Everything is in the support sole's horizontal frame, x forward and y to the
   * left (`AutoMovieEnginePhysicalPlanarPolygon`):
   *
   * 1. The support foot's vertices the capture point sees are the extreme centres of
   *    pressure; with the capture point inside the foot the region is the whole
   *    reachable region.
   * 2. From each extreme the capture point is predicted after the time left, cop +
   *    (xi - cop) e^(omega t), and the ray on from it away from that extreme is
   *    cut by a circle about the foot's centroid of `APPROXIMATION_MULTIPLIER`
   *    times the reach; seven more points on that circle join the first ray's
   *    point to the last's, turning clockwise.
   * 3. The hull of those points, intersected with the reachable region, is the
   *    capture region; it is empty when they do not meet, or when a ray misses
   *    the circle.
   *
   * @param input The support foot's side, the swing time left, seconds, the
   *   capture point, the pendulum's rate, per second, the support foot's
   *   clockwise outline, the foot width, metres, and the kinematic step range,
   *   metres.
   * @returns The capture region, clockwise; empty when there is none.
   */
  export function compute(
    input: Parameters<typeof computeRegion>[0],
  ): ReturnType<typeof computeRegion> {
    return computeRegion(input);
  }
  /** The reachable region's vertex count, its fan's plus one (l.27). */
  export const MAX_CAPTURE_REGION_POLYGON_POINTS: number = 20;

  /** The circle points joining the kinematic extremes, plus one (l.28). */
  export const KINEMATIC_LIMIT_POINTS: number = 8;

  /** The far circle's radius over the step range (l.126). */
  export const APPROXIMATION_MULTIPLIER: number = 100;

  /** The reachable fan's angle over pi (l.29). */
  export const REACHABLE_REGION_CUTOFF_ANGLE: number = 1.0;

  /**
   * The capture region before the reachable cut (l.165-218): the hull of each
   * visible support vertex's predicted capture point and its ray's point on
   * the far circle, with the circle's points between the first and last rays.
   *
   * @param input The swing time left, seconds, the capture point, the
   *   pendulum's rate, per second, the support's clockwise outline, and the
   *   step range, metres, for the far circle.
   * @returns The raw region; undefined when the capture point lies inside the
   *   support, so every reachable point captures; empty when a ray misses the
   *   circle.
   */
  export function raw(input: {
    remaining: number;
    capture: Polygon.IPoint;
    omega: number;
    foot: readonly Polygon.IPoint[];
    range: number;
  }): Polygon.IPoint[] | undefined {
    return rawRegion(input);
  }

  /**
   * The region a swing foot can reach from a support foot (l.102-123): a fan of
   * the step range's radius over the cutoff angle times pi toward the swing
   * side, its points within half the foot width of the sole's x-axis moved out
   * to it, closed by the point half a foot width to that side.
   *
   * @param support The support foot's side; the fan opens to the other.
   * @param footWidth The foot width, metres.
   * @param range The kinematic step range, metres.
   * @returns The region, clockwise, in the support sole's frame.
   */
  export function reachable(
    support: "left" | "right",
    footWidth: number,
    range: number,
  ): Polygon.IPoint[] {
    // RobotSide.negateIfLeftSide(1.0): the fan opens away from the support.
    const sign: number = support === "left" ? -1 : 1;
    const points: Polygon.IPoint[] = [];
    for (let i: number = 0; i < MAX_CAPTURE_REGION_POLYGON_POINTS - 1; i++) {
      const angle: number =
        (sign * REACHABLE_REGION_CUTOFF_ANGLE * Math.PI * i) /
        (MAX_CAPTURE_REGION_POLYGON_POINTS - 2);
      const x: number = range * Math.cos(angle);
      let y: number = range * Math.sin(angle);
      if (Math.abs(y) < footWidth / 2) y = (sign * footWidth) / 2;
      points.push({ x, y });
    }
    points.push({ x: 0, y: (sign * footWidth) / 2 });
    return Polygon.hull(points);
  }
}

/**
 * Where the ray from b along v leaves the circle about a of radius r, the
 * larger root of |b + l v - a|^2 = r^2 (CaptureRegionMathTools l.33-71, after
 * J. Pratt's notes of 18 February 2009); undefined when the ray's line misses
 * the circle.
 */
function ray(
  a: Polygon.IPoint,
  b: Polygon.IPoint,
  v: Polygon.IPoint,
  r: number,
): Polygon.IPoint | undefined {
  const qa: number = v.x * v.x + v.y * v.y;
  const qb: number = 2 * v.x * (b.x - a.x) + 2 * v.y * (b.y - a.y);
  const qc: number = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 - r * r;
  const discriminant: number = qb * qb - 4 * qa * qc;
  if (discriminant < 0) return undefined;
  const l: number = (-qb + Math.sqrt(discriminant)) / (2 * qa);
  return { x: b.x + l * v.x, y: b.y + l * v.y };
}
