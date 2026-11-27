import type {
  AutoMoviePathGround,
  IAutoMovieFollowPathMotion,
  IAutoMovieKeyframe,
  IAutoMoviePathFrame,
  IAutoMoviePathLocomotion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { segmentIndex } from "../../math/internal/segmentIndex";

/*
 * Bake an admitted in-place gait along an authored world XZ polyline, ignoring
 * waypoint Y and sampling height from optional ground. Whole cycles nearest
 * requested speed determine exact-arrival duration; yaw follows the tangent
 * with a shortest-arc corner blend, and gait root bob/sway rotates with
 * heading. Pathfinding is outside this operation.
 */
export function followPathMotion(
  props: IAutoMovieFollowPathMotion.IProps,
): IAutoMoviePathLocomotion {
  const turnWindow: number = props.turnWindow ?? DEFAULT_TURN_WINDOW;
  if (props.speed <= 0)
    throw new Error("path speed must be finite and positive");
  if (props.gait.duration <= 0)
    throw new Error("path gait duration must be finite and positive");
  if (turnWindow < 0)
    throw new Error("path turn window must be finite and non-negative");

  const segments: ISegment[] = buildSegments(props.waypoints);
  const last: ISegment = segments[segments.length - 1]!;
  const length: number = last.from + last.length;
  const cycles: number = Math.max(
    1,
    Math.round(length / (props.speed * props.gait.duration)),
  );
  const duration: number = cycles * props.gait.duration;
  if (duration <= 0)
    throw new Error("path duration must be finite and positive");
  const speed: number = length / duration;
  const halfWindows: number[] = cornerHalfWindows(segments, turnWindow);

  const keyframes: IAutoMovieKeyframe[] = [];
  const frames: IAutoMoviePathFrame[] = [];
  for (let c: number = 0; c < cycles; ++c)
    for (const k of props.gait.keyframes) {
      // drop the duplicate seam keyframe (a later cycle's time:0) so times stay
      // strictly increasing: the prior cycle's final frame covers the pose,
      // but the seam carries the incoming cycle's first-segment easing (#1012)
      if (c > 0 && k.time === 0) {
        const seam: IAutoMovieKeyframe = keyframes[keyframes.length - 1]!;
        keyframes[keyframes.length - 1] = {
          ...seam,
          easing: k.easing,
          bezier: k.bezier,
        };
        continue;
      }
      const globalT: number = c * props.gait.duration + k.time;
      const s: number = Math.min(length, speed * globalT);
      const index: number = segmentIndexAt(segments, s);
      const seg: ISegment = segments[index]!;
      const x: number = seg.x + seg.dirX * (s - seg.from);
      const z: number = seg.z + seg.dirZ * (s - seg.from);
      const y: number = groundHeightAt(props.ground, x, z);
      const yawDeg: number = yawAt(segments, halfWindows, s, index);
      const facing: IAutoMovieQuaternion = yawRotation(yawDeg);
      const baseRoot: IAutoMovieKeyframe["pose"]["root"] = k.pose.root;
      frames.push({
        time: globalT,
        position: { x, y, z },
        yawDeg,
        tangent: {
          x: Math.sin(yawDeg * DEG2RAD),
          y: 0,
          z: Math.cos(yawDeg * DEG2RAD),
        },
      });
      // The gait's own root (a bob or sway) is model-frame data; rotate it by
      // the path facing before adding the world path position (#1012).
      const baseTranslation: IAutoMovieVector3 | undefined =
        baseRoot === null
          ? undefined
          : Quaternion.rotateVector(facing, baseRoot.translation);
      keyframes.push({
        ...k,
        time: globalT,
        pose: {
          ...k.pose,
          root: {
            translation: {
              x: (baseTranslation?.x ?? 0) + x,
              y: (baseTranslation?.y ?? 0) + y,
              z: (baseTranslation?.z ?? 0) + z,
            },
            rotation: Quaternion.multiply(
              facing,
              baseRoot?.rotation ?? IDENTITY_ROT,
            ),
            scale: baseRoot?.scale ?? { ...IDENTITY_SCALE },
          },
        },
      });
    }

  return {
    motion: {
      id: props.id,
      skeleton: props.gait.skeleton,
      duration,
      loop: false,
      keyframes,
      // The path bake repeats the gait cycle continuously (phase never resets
      // across corners), so the composite's stride clock is the gait's own.
      gaitCycle: props.gait.gaitCycle ?? {
        period: props.gait.duration,
        phaseAt: 0,
      },
    },
    frames,
    length,
    speed,
    cycles,
  };
}

const IDENTITY_ROT: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

const IDENTITY_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Rotations about the fixed world-up axis.
 */
const yawRotation: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle(UP);

const RAD2DEG: number = 180 / Math.PI;

const DEG2RAD: number = Math.PI / 180;

const MIN_SEGMENT: number = 1e-9;

const DEFAULT_TURN_WINDOW: number = 0.5;

/*
 * One straight XZ stretch of the polyline, arc-length addressed.
 */
interface ISegment {
  /*
   * Start of the stretch on the ground plan.
   */
  x: number;
  z: number;

  /*
   * Unit XZ direction.
   */
  dirX: number;
  dirZ: number;

  /*
   * Facing of this stretch, degrees about +Y.
   */
  yawDeg: number;

  /*
   * Stretch length, meters.
   */
  length: number;

  /*
   * Cumulative arc length at the stretch start.
   */
  from: number;
}

/*
 * Validate the waypoints and cut them into arc-length-addressed stretches.
 */
const buildSegments: (waypoints: readonly IAutoMovieVector3[]) => ISegment[] = (
  waypoints: readonly IAutoMovieVector3[],
): ISegment[] => {
  if (waypoints.length < 2)
    throw new Error("path needs at least two waypoints");
  const segments: ISegment[] = [];
  let from: number = 0;
  for (let i: number = 0; i + 1 < waypoints.length; ++i) {
    const dx: number = waypoints[i + 1]!.x - waypoints[i]!.x;
    const dz: number = waypoints[i + 1]!.z - waypoints[i]!.z;
    const stretch: number = Math.hypot(dx, dz);
    if (stretch <= MIN_SEGMENT)
      throw new Error(`path waypoints ${i} and ${i + 1} coincide in XZ`);
    const end: number = from + stretch;
    if (end <= from)
      throw new Error(`path stretch ${i} must advance a finite arc length`);
    segments.push({
      x: waypoints[i]!.x,
      z: waypoints[i]!.z,
      dirX: dx / stretch,
      dirZ: dz / stretch,
      yawDeg: Math.atan2(dx, dz) * RAD2DEG,
      length: stretch,
      from,
    });
    from = end;
  }
  return segments;
};

/*
 * Half-width of the yaw blend at each corner (indexed by the segment the corner
 * starts): capped so adjacent corners' windows never overlap past a stretch
 * midpoint. Index 0 (the path start) has no corner.
 */
const cornerHalfWindows: (
  segments: readonly ISegment[],
  turnWindow: number,
) => number[] = (
  segments: readonly ISegment[],
  turnWindow: number,
): number[] => {
  const halves: number[] = [0];
  for (let i: number = 1; i < segments.length; ++i)
    halves.push(
      Math.min(
        turnWindow / 2,
        segments[i - 1]!.length / 2,
        segments[i]!.length / 2,
      ),
    );
  return halves;
};

/*
 * The stretch containing arc length `s`; boundaries go to the earlier one.
 */
const segmentIndexAt: (segments: readonly ISegment[], s: number) => number = (
  segments: readonly ISegment[],
  s: number,
): number => {
  const last: ISegment = segments[segments.length - 1]!;
  if (s <= 0) return 0;
  if (s >= last.from + last.length) return segments.length - 1;
  return segmentIndex(
    segments.length + 1,
    (index: number): number =>
      index === 0 ? 0 : segments[index - 1]!.from + segments[index - 1]!.length,
    s,
  );
};

/*
 * Facing at arc length `s`, linearly blended inside a corner window.
 */
const yawAt: (
  segments: readonly ISegment[],
  halfWindows: readonly number[],
  s: number,
  k: number,
) => number = (
  segments: readonly ISegment[],
  halfWindows: readonly number[],
  s: number,
  k: number,
): number => {
  const seg: ISegment = segments[k]!;
  if (k + 1 < segments.length) {
    const corner: number = seg.from + seg.length;
    const half: number = halfWindows[k + 1]!;
    if (half > 0 && s >= corner - half)
      return blendYaw(
        seg.yawDeg,
        segments[k + 1]!.yawDeg,
        (s - (corner - half)) / (2 * half),
      );
  }
  if (k > 0) {
    const corner: number = seg.from;
    const half: number = halfWindows[k]!;
    if (half > 0 && s < corner + half)
      return blendYaw(
        segments[k - 1]!.yawDeg,
        seg.yawDeg,
        (s - (corner - half)) / (2 * half),
      );
  }
  return seg.yawDeg;
};

/*
 * Blend from `a` toward `b` (degrees) along the shortest angular arc.
 */
const blendYaw: (a: number, b: number, t: number) => number = (
  a: number,
  b: number,
  t: number,
): number => a + (((((b - a) % 360) + 540) % 360) - 180) * t;

/*
 * Ground height at a plan point: scalar plane, callback, or flat 0.
 */
const groundHeightAt: (
  ground: AutoMoviePathGround | undefined,
  x: number,
  z: number,
) => number = (
  ground: AutoMoviePathGround | undefined,
  x: number,
  z: number,
): number => {
  if (ground === undefined) return 0;
  if (typeof ground === "number") return ground;
  const y: number = ground(x, z);
  return y;
};
