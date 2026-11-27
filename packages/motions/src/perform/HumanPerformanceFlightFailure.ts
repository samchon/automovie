import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/internal/poseBones";

/** Metres, or a raw action's heading/pitch/roll in degrees. */
type Vector = [number, number, number];

/** Quaternion components in x/y/z/w order. */
type Rotation = [number, number, number, number];
/** The record of `IShapeRawLimbsItem`'s site. */
type IShapeRawLimbsItem = {
  limb: string;
  point: Vector;
  bend: Vector;
  rotation: Rotation | null;
  contact: Vector | null;
  planted: boolean | null;
  on: string | null;
};

/** Owned raw-law and final displayed-shape numbers at one requested second. */
interface IShape {
  /** The law's world root in metres, before composition and fitting. */
  rawRoot: Vector;

  /** Degrees in yaw/pitch/roll order. */
  rawHeading: Vector;

  /** Directly authored bone and clinical degree triples. */
  rawJoints: [string, number, number, number][];

  /** Named world goals and their contact/plant branch, with owned tuples. */
  rawLimbs: IShapeRawLimbsItem[];

  /** Displayed world root position before its removal from shape FK. */
  rootPosition: Vector | null;

  /** Displayed world root rotation before its removal from shape FK. */
  rootRotation: Rotation | null;

  /** Final displayed clinical degrees, retaining neutral nulls. */
  joints: [string, number | null, number | null, number | null][];

  /** Final root-frame bone position in metres and quaternion x/y/z/w. */
  bones: [string, Vector, Rotation][];
}
/** The record of `IHumanPerformanceFlightFailureBoundaryItem`'s site. */
type IHumanPerformanceFlightFailureBoundaryItem = {
  time: number;
  local: number;
  shape: IShape | null;
  error: string | null;
};

/**
 * Explain a failed flight with the same performance's takeoff boundary shape.
 *
 * The takeoff and its immediately adjacent binary64 seconds are diagnostic
 * requests only. Their rounded action-local times and raw goals accompany
 * post-final-plant displayed joints and root-identity FK. Adjacent film times
 * can map to the same action branch; these samples do not certify continuity.
 *
 * @param error The owned trajectory failure already enriched with mass history.
 * @param body The same unchanged body used by the failed flight.
 * @param plan Its original pure action plan, before any flight rotation
 *   handback.
 * @param start The action's placed start in film seconds.
 * @param takeoff The flight's actual takeoff in film seconds.
 * @param unturned The same composed displayed-pose reader used by its history.
 * @param resolution Optional original FK supplier borrowed for these
 *   synchronous full-bone diagnostic reads only.
 * @returns The same error, with copied boundary numbers in its fields and
 *   message; a secondary read failure is recorded without masking the
 *   original.
 */
export function HumanPerformanceFlightFailure(
  error: Error,
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
  start: number,
  takeoff: number,
  unturned: (seconds: number) => IAutoMoviePose,
  resolution?: () => ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
): Error {
  const boundary: IHumanPerformanceFlightFailureBoundaryItem[] = [];
  const view: DataView = new DataView(new ArrayBuffer(8));
  for (const time of [
    neighbour(takeoff, -1, view),
    takeoff,
    neighbour(takeoff, 1, view),
  ]) {
    const local: number = Math.min(plan.duration, Math.max(0, time - start));
    try {
      const raw: ReturnType<typeof plan.posture> = plan.posture(local);
      const shape: IShape = {
        rawRoot: vector(raw.root),
        rawHeading: [raw.yaw, raw.pitch, raw.roll],
        rawJoints: [],
        rawLimbs: [],
        rootPosition: null,
        rootRotation: null,
        joints: [],
        bones: [],
      };
      for (const [bone, angles] of Object.entries(raw.joints))
        if (angles !== undefined)
          shape.rawJoints.push([bone, angles[0], angles[1], angles[2]]);
      for (const [limb, goal] of Object.entries(raw.limbs))
        if (goal !== undefined)
          shape.rawLimbs.push({
            limb,
            point: vector(goal.point),
            bend: vector(goal.bend),
            rotation:
              goal.rotation === undefined ? null : rotation(goal.rotation),
            contact: goal.contact === undefined ? null : vector(goal.contact),
            planted: goal.planted ?? null,
            on: goal.on ?? null,
          });
      const pose: IAutoMoviePose = unturned(time);
      shape.rootPosition =
        pose.root === null ? null : vector(pose.root.translation);
      shape.rootRotation =
        pose.root === null ? null : rotation(pose.root.rotation);
      shape.joints = pose.joints.map(
        (joint: IAutoMovieJointPose): IShape["joints"][number] => [
          joint.bone,
          joint.flexion,
          joint.abduction,
          joint.twist,
        ],
      );
      for (const bone of poseBones(
        body,
        { ...pose, root: null },
        resolution?.(),
      ).values())
        shape.bones.push(boneNumbers(bone));
      boundary.push({ time, local, shape, error: null });
    } catch (problem) {
      boundary.push({
        time,
        local,
        shape: null,
        error:
          problem instanceof Error
            ? problem.message
            : "Boundary query threw a non-Error value",
      });
    }
  }
  error.message += `; takeoff ${JSON.stringify(boundary)}`;
  return Object.assign(error, { takeoffBoundary: boundary });
}

/** Preserve all three numbers without retaining the source vector. */
function vector(value: IAutoMovieVector3): Vector {
  return [value.x, value.y, value.z];
}

/** Preserve the frame's four numbers without retaining the source quaternion. */
function rotation(value: IAutoMovieQuaternion): Rotation {
  return [value.x, value.y, value.z, value.w];
}

/** Copy one resolved bone's root-frame physical transform. */
function boneNumbers(bone: IAutoMovieResolvedBone): IShape["bones"][number] {
  return [bone.bone, vector(bone.worldPosition), rotation(bone.worldRotation)];
}
/** The alternatives of `NeighbourDirection`'s site. */
type NeighbourDirection = -1 | 1;

/** Adjacent finite-film time by IEEE encoding, without an authored time offset. */
function neighbour(
  value: number,
  direction: NeighbourDirection,
  view: DataView,
): number {
  if (value === 0) return direction * Number.MIN_VALUE;
  view.setFloat64(0, value, false);
  const change: bigint = BigInt(value > 0 ? direction : -direction);
  view.setBigUint64(0, view.getBigUint64(0, false) + change, false);
  return view.getFloat64(0, false);
}
