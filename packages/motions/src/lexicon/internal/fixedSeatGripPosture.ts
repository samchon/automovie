import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";

type Points = Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;
type Joints = IAutoMovieMotionHumanPosture["joints"];
type Pair = readonly [number, number];
type Angles = readonly [number, number, number];
const RAD: number = Math.PI / 180;
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** A single bearing station and the scapular assistance needed at each instant. */
interface IWorking {
  shift: IAutoMovieVector3;
  joints(degrees: number, share: number, wrists: Points): Joints;
}
type OptionalWorking = IWorking | undefined;
type OptionalClavicle = IClavicle | undefined;
type OptionalBone = IAutoMovieBone | undefined;
type OptionalFrame = IAutoMovieAxisFrame | undefined;
type OptionalRange = IAutoMovieAngleRange | null;
type OptionalConstraint = IAutoMovieJointConstraint | undefined;
type OptionalAxes = IAutoMovieJointAxes | undefined;
interface IClavicle {
  side: AutoMovieHumanSide;
  bone: AutoMovieHumanoidBone;
  placed: IAutoMovieResolvedBone;
  tip: IAutoMovieVector3;
  length: number;
  arm: number;
  sign: number;
  flex: Pair;
  abduct: Pair;
  flexFrame: OptionalFrame;
  abductFrame: OptionalFrame;
  entry: Angles;
}
interface ITarget {
  arm: IClavicle;
  parent: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  target: IAutoMovieVector3;
  local: IAutoMovieVector3;
  best: Pair;
}
function range(axis: OptionalRange, frame: OptionalFrame): Pair {
  const a: number = (AutoMovieEngineKinematics.toRigAngle(axis?.min ?? 0, frame) ?? 0) * RAD,
    b: number = (AutoMovieEngineKinematics.toRigAngle(axis?.max ?? 0, frame) ?? 0) * RAD;
  return [Math.min(a, b), Math.max(a, b)];
}
/** Maximum of a_cos(t)+b_sin(t) on one clinical interval. */
function maximum(a: number, b: number, limits: Pair): number {
  const [lo, hi]: Pair = limits;
  const phase: number = Math.atan2(b, a);
  if (phase >= lo && phase <= hi) return phase;
  return a * Math.cos(lo) + b * Math.sin(lo) >=
    a * Math.cos(hi) + b * Math.sin(hi)
    ? lo
    : hi;
}
function tip(arm: IClavicle, f: number, a: number): IAutoMovieVector3 {
  const x: number = arm.tip.x * Math.cos(f) + arm.tip.z * Math.sin(f);
  return {
    x: x * Math.cos(a),
    y: x * Math.sin(a),
    z: arm.tip.z * Math.cos(f) - arm.tip.x * Math.sin(f),
  };
}
function clavicle(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  entry: Joints,
): OptionalClavicle {
  const name: AutoMovieHumanoidBone = `${side}Shoulder`;
  const bone: OptionalBone = body.bones.get(name),
    upper: OptionalBone = body.bones.get(`${side}UpperArm`),
    elbow: OptionalBone = body.bones.get(`${side}LowerArm`),
    hand: OptionalBone = body.bones.get(`${side}Hand`);
  const placed: IAutoMovieResolvedBone | undefined = bones.get(name);
  const limit: OptionalConstraint =
    bone?.constraint ?? DEFAULT_HUMANOID_ROM[name];
  const axes: OptionalAxes = body.poseResolution.jointAxes[name];
  if (
    !bone ||
    !placed ||
    !limit ||
    !axes ||
    upper?.parent !== name ||
    elbow?.parent !== upper.bone ||
    hand?.parent !== elbow.bone ||
    limit.twist !== null ||
    limit.swingTwist !== undefined ||
    (limit.swingDeg !== undefined && limit.swingDeg !== null) ||
    axes.flexion.y !== 1 ||
    axes.abduction.z !== 1 ||
    upper.rest.translation.y !== 0
  )
    return undefined;
  const v: IAutoMovieVector3 = upper.rest.translation,
    flexFrame: OptionalFrame = HUMANOID_REST_FRAME[name]?.flexion,
    abductFrame: OptionalFrame = HUMANOID_REST_FRAME[name]?.abduction;
  const flex: Pair = range(limit.flexion, flexFrame),
    far: number = Math.max(Math.abs(flex[0]), Math.abs(flex[1]));
  // A fixed sign of the flexed lateral component separates elevation from protraction.
  if (
    far >= Math.PI / 2 ||
    Math.abs(v.x) * Math.cos(far) <= Math.abs(v.z) * Math.sin(far)
  )
    return undefined;
  return {
    side,
    bone: name,
    placed,
    tip: v,
    length: Vector3.length(v),
    arm:
      Vector3.length(elbow.rest.translation) +
      Vector3.length(hand.rest.translation),
    sign: Math.sign(v.x),
    flex,
    abduct: range(limit.abduction, abductFrame),
    flexFrame,
    abductFrame,
    entry: entry[name] ?? [0, 0, 0],
  };
}
/**
 * Choose a common bearing station from both wrist spheres on the actual seat,
 * then assist a wrist only when its unassisted shoulder cannot reach.
 *
 * @param body The rig supplying the scapular orientation and the arm lengths.
 * @param seated The original sitting posture and hand joints.
 * @param bearing The actual seat socket of that posture.
 * @param seat The front edge of the working seat in the original world.
 * @param degrees The pelvic swing when the grip is first fully taken.
 * @param wrists The two requested wrist positions at that instant.
 * @returns One supported shift and the local joint reader, when both arm
 *   spheres admit the station.
 */
export function fixedSeatGripPosture(
  body: IAutoMovieMotionHumanBody,
  seated: IAutoMovieMotionHumanPosture,
  bearing: IAutoMovieVector3,
  seat: IAutoMovieRigidTransform,
  degrees: number,
  wrists: Points,
): OptionalWorking {
  if (!wrists.left || !wrists.right) return undefined;
  const clean: IAutoMovieMotionHumanPosture = {
    ...seated,
    limbs: {},
    joints: {
      ...seated.joints,
      leftShoulder: [0, 0, 0],
      rightShoulder: [0, 0, 0],
    },
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, clean),
    undefined,
    new Set<AutoMovieHumanoidBone>(["leftShoulder", "rightShoulder"]),
  );
  const arms: IClavicle[] = [];
  for (const side of SIDES) {
    const arm: OptionalClavicle = clavicle(body, side, bones, seated.joints);
    if (arm === undefined) return undefined;
    arms.push(arm);
  }
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(seat.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const available: number = Math.max(
    0,
    Vector3.dot(Vector3.subtract(seat.position, bearing), forward),
  );
  const axis: IAutoMovieVector3 = {
    x: Math.cos(seated.yaw * RAD),
    y: 0,
    z: -Math.sin(seated.yaw * RAD),
  };
  function targets(angle: number, shift: number, points: Points): ITarget[] {
    const q: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axis, angle),
      pivot: IAutoMovieVector3 = Vector3.add(
        bearing,
        Vector3.scale(forward, shift),
      );
    return arms.map((arm: IClavicle): ITarget => {
      const parent: IAutoMovieVector3 = Vector3.add(
        pivot,
        Quaternion.rotateVector(
          q,
          Vector3.subtract(arm.placed.worldPosition, bearing),
        ),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
          q,
          arm.placed.worldRotation,
        ),
        target: IAutoMovieVector3 = points[arm.side]!;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(rotation),
        Vector3.subtract(target, parent),
      );
      const a: number = maximum(
          arm.sign * local.x,
          arm.sign * local.y,
          arm.abduct,
        ),
        k: number = local.x * Math.cos(a) + local.y * Math.sin(a);
      const f: number = maximum(
        k * arm.tip.x + local.z * arm.tip.z,
        k * arm.tip.z - local.z * arm.tip.x,
        arm.flex,
      );
      return { arm, parent, rotation, target, local, best: [f, a] };
    });
  }
  let lower: number = 0,
    upper: number = available,
    preferred: number = 0;
  for (const t of targets(degrees, available, wrists)) {
    const best: IAutoMovieVector3 = Vector3.add(
      t.parent,
      Quaternion.rotateVector(t.rotation, tip(t.arm, ...t.best)),
    );
    const off: IAutoMovieVector3 = Vector3.subtract(
      t.target,
      Vector3.subtract(best, Vector3.scale(forward, available)),
    );
    const along: number = Vector3.dot(off, forward),
      across: number = Vector3.length(
        Vector3.subtract(off, Vector3.scale(forward, along)),
      );
    if (across > t.arm.arm) return undefined;
    const radius: number = Math.sqrt(
      Math.max(0, (t.arm.arm - across) * (t.arm.arm + across)),
    );
    lower = Math.max(lower, along - radius);
    upper = Math.min(upper, along + radius);
    const working: number = t.arm.arm * HumanMountRider.ARM;
    preferred = Math.max(
      preferred,
      along - Math.sqrt(Math.max(0, (working - across) * (working + across))),
    );
  }
  if (lower > upper) return undefined;
  const station: number = Math.max(lower, Math.min(upper, preferred));
  return {
    shift: Vector3.scale(forward, station),
    joints: (angle: number, share: number, points: Points): Joints => {
      const joints: Joints = {};
      for (const t of targets(angle, station * share, points)) {
        const arm: IClavicle = t.arm,
          f: number = (AutoMovieEngineKinematics.toRigAngle(arm.entry[0], arm.flexFrame) ?? 0) * RAD,
          a: number = (AutoMovieEngineKinematics.toRigAngle(arm.entry[1], arm.abductFrame) ?? 0) * RAD;
        const demand: number =
          (Vector3.dot(t.local, t.local) +
            arm.length * arm.length -
            arm.arm * arm.arm) /
          2;
        const score: (s: number) => number = (s: number): number =>
          Vector3.dot(
            t.local,
            tip(arm, f + (t.best[0] - f) * s, a + (t.best[1] - a) * s),
          );
        if (score(0) >= demand) continue;
        let high: number = 1;
        if (score(high) > demand) {
          let low: number = 0;
          for (;;) {
            const mid: number = (low + high) / 2;
            if (mid === low || mid === high) break;
            if (score(mid) >= demand) high = mid;
            else low = mid;
          }
        }
        joints[arm.bone] = [
          AutoMovieEngineKinematics.toClinicalAngle(
            (f + (t.best[0] - f) * high * share) / RAD,
            arm.flexFrame,
          ) ?? 0,
          AutoMovieEngineKinematics.toClinicalAngle(
            (a + (t.best[1] - a) * high * share) / RAD,
            arm.abductFrame,
          ) ?? 0,
          arm.entry[2],
        ];
      }
      return joints;
    },
  };
}
