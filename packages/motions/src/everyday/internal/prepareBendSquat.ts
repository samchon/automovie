import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  getConstraint,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";
import { bendLower } from "./bendLower";
import { braceOnThighPoint } from "./braceOnThighPoint";
import { seatedPairDepth } from "./seatedPairDepth";

type Strategy = Exclude<keyof typeof bendLower.KNEE, "stoop">;
/**
 * The wrist's place in a posture: fixed, or on a carried surface. A trial
 * offers its same-pose displayed bones.
 */
type Wrist = (
  posture: IAutoMovieMotionHumanPosture,
  bones?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
) => IAutoMovieVector3;
type Course = (
  posture: IAutoMovieMotionHumanPosture,
  share: number,
  standing: IAutoMovieMotionHumanPosture,
) => IAutoMovieMotionHumanPosture;
type Angles = [
  knee: number,
  ankle: number,
  pitch: number,
  roll: number,
  spine: number,
  chest: number,
  lateral: number,
  twist: number,
];

/** A trial's residuals and the lower posture they were read on. */
interface ITrial {
  /** The residual rows. */
  rows: number[];

  /** The lower posture. */
  legs: IAutoMovieMotionHumanPosture;
}

const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
const RAD: number = Math.PI / 180;

/**
 * Recover a supported, unilateral squat when the nominal sagittal course folds
 * the lumbar skin into a thigh. Two links locate the hips above the actual
 * ankle centres while both hindfoot goals keep their material pivots. The event
 * solve varies the loaded ankle, knee, pelvis and trunk on their clinical
 * intervals. Playback reads the one resulting contact key.
 */
export function prepareBendSquat(
  body: IAutoMovieMotionHumanBody,
  standing: IAutoMovieMotionHumanPosture,
  nominal: IAutoMovieMotionHumanPosture,
  strategy: Strategy,
  side: AutoMovieHumanSide,
  wrist: Wrist,
): Course | undefined {
  const native = (
    p: IAutoMovieMotionHumanPosture,
  ): ReturnType<typeof poseBones> =>
    poseBones(body, resolveHumanPosture(body, p));
  const depths = SIDES.map((s: AutoMovieHumanSide) =>
    seatedPairDepth(body, "spine", `${s}UpperLeg`),
  );
  const crossed = SIDES.map((s) =>
    seatedPairDepth(
      body,
      `${s}LowerLeg`,
      s === "left" ? "rightUpperLeg" : "leftUpperLeg",
    ),
  );
  const original = HumanColliders.placed(body, native(nominal));
  if (depths.every((depth) => depth(original) === 0)) return undefined;
  const upright = native(standing);
  const ground = SIDES.map((s) =>
    Math.min(...HumanFoot.sockets(body, upright, s).map((f) => f.point.y)),
  );
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const braced = braceOnThighPoint(body, other, { x: 0, y: 1, z: 0 });
  const palm = HumanHand.offset(body, other, "palm", "flat");
  const span: number = body.measure.upperArm + body.measure.forearm;
  const clinical = (bone: AutoMovieHumanoidBone): IAutoMovieJointConstraint =>
    getConstraint(bone, body.bones.get(bone)?.constraint ?? null)!;
  const spine = clinical("spine"),
    chest = clinical("chest");
  const rollLimit: number = spine.abduction!.max;
  const twistLimit: number = Math.min(spine.twist!.max, chest.twist!.max) * 2;
  const lateralLimit: number =
    Math.min(spine.abduction!.max, chest.abduction!.max) * 2;
  const knee: number = bendLower.KNEE[strategy];
  const lo: Angles = [knee, 0, 0, -rollLimit, 0, 0, -lateralLimit, -twistLimit];
  const hi: Angles = [
    clinical(`${side}LowerLeg`).flexion!.max,
    ANKLE_DORSIFLEXION.loaded,
    clinical(`${side}UpperLeg`).flexion!.max,
    rollLimit,
    spine.flexion!.max,
    chest.flexion!.max,
    lateralLimit,
    twistLimit,
  ];
  const local = HumanFrame.local(
    { origin: standing.root, yaw: standing.yaw },
    wrist(nominal),
  );
  const lean: number = Math.atan2(-local.x, -local.y) / RAD;
  const turn: number =
    (Math.atan2(local.z, Math.abs(local.x)) / RAD) * (side === "left" ? -1 : 1);
  const initial: Angles = [
    knee,
    strategy === "squat" ? hi[1] : bendLower.ANKLE,
    Math.atan2(body.measure.thigh, body.measure.shank) / RAD,
    lean,
    0,
    hi[5],
    lean,
    turn,
  ];
  const ankle = Vector3.lerp(
    nominal.limbs.leftLeg!.point,
    nominal.limbs.rightLeg!.point,
    0.5,
  );
  const targets = SIDES.map((s) => {
    const g = nominal.limbs[`${s}Leg`]!;
    return HumanFoot.sockets(body, upright, s).map(({ socket }) =>
      HumanFoot.point(
        body,
        s,
        socket,
        { ankle: g.point, rotation: g.rotation! },
        nominal.joints[`${s}Toes`]?.[0] ?? 0,
      ),
    );
  });
  const meanStanding = (
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 =>
    Vector3.lerp(
      upright.get(a)!.worldPosition,
      upright.get(b)!.worldPosition,
      0.5,
    );
  const startAnkle = meanStanding("leftFoot", "rightFoot");
  const startKnee = meanStanding("leftLowerLeg", "rightLowerLeg");
  const startHip = meanStanding("leftUpperLeg", "rightUpperLeg");
  const legFrame = { origin: startAnkle, yaw: standing.yaw };
  const lower = HumanFrame.local(legFrame, startKnee);
  const upper = HumanFrame.local({ ...legFrame, origin: startKnee }, startHip);
  const startShank: number = Math.atan2(lower.z, lower.y);
  const startThigh: number = Math.atan2(-upper.z, upper.y);
  /**
   * The root and both planted knee planes depend only on the first four
   * coordinates.
   */
  const lowerBody = (q: readonly number[]): IAutoMovieMotionHumanPosture => {
    const shank: number = (q[1]! + bendLower.HEEL[strategy]) * RAD,
      thigh: number = q[0]! * RAD - shank;
    const centre = HumanFrame.point(
      { origin: ankle, yaw: standing.yaw },
      {
        x: 0,
        y:
          body.measure.shank * Math.cos(shank) +
          body.measure.thigh * Math.cos(thigh),
        z:
          body.measure.shank * Math.sin(shank) -
          body.measure.thigh * Math.sin(thigh),
      },
    );
    const p: IAutoMovieMotionHumanPosture = {
      ...nominal,
      root: { x: 0, y: 0, z: 0 },
      pitch: q[2]!,
      roll: q[3]!,
    };
    const hips = hipJoints(body, p.root, humanPostureHeading(p), p.joints.hips);
    return kneePlanes(body, {
      ...p,
      root: Vector3.subtract(centre, Vector3.lerp(hips.left, hips.right, 0.5)),
    });
  };
  /** Lay the current trunk angles over the same material lower posture. */
  const trunk = (
    legs: IAutoMovieMotionHumanPosture,
    q: readonly number[],
  ): IAutoMovieMotionHumanPosture => ({
    ...legs,
    joints: {
      ...legs.joints,
      spine: [q[4]!, q[6]! / 2, q[7]! / 2],
      chest: [q[5]!, q[6]! / 2, q[7]! / 2],
    },
  });
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  /** Inspect one proposed posture: its legs, trunk and fit, solved afresh. */
  const residual = (q: readonly number[]): ITrial => {
    const legs: IAutoMovieMotionHumanPosture = lowerBody(q);
    const p: IAutoMovieMotionHumanPosture = trunk(legs, q);
    const seeded: ReturnType<typeof resolveHumanPostureSource.fit> =
      resolveHumanPostureSource.fit(
        body,
        resolveHumanPostureSource.assemble(body, p),
        undefined,
        undefined,
        resolution,
      );
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      seeded.pose,
      resolution(),
    );
    const placed = HumanColliders.placed(body, bones);
    const site = braced(bones);
    const braceWrist = Vector3.subtract(
      site.point,
      Quaternion.rotateVector(site.rotation, palm.point),
    );
    const rows: number[] = [
      Math.max(
        0,
        Vector3.distance(
          bones.get(`${side}UpperArm`)!.worldPosition,
          wrist(p, bones),
        ) - span,
      ),
      Math.max(
        0,
        Vector3.distance(
          bones.get(`${other}UpperArm`)!.worldPosition,
          braceWrist,
        ) - span,
      ),
      ...depths.map((depth) => depth(placed)),
    ];
    rows.push(...crossed.map((depth) => depth(placed)));
    SIDES.forEach((s, i) => {
      const foot = bones.get(`${s}Foot`)!,
        g = p.limbs[`${s}Leg`]!,
        c = g.contact ?? { x: 0, y: 0, z: 0 };
      const sockets = HumanFoot.sockets(body, bones, s);
      for (let j = 0; j < sockets.length; ++j) {
        const error = Vector3.subtract(sockets[j]!.point, targets[i]![j]!);
        rows.push(error.x, error.y, error.z);
      }
      rows.push(
        Math.min(...sockets.map((f) => f.point.y)) - ground[i]!,
        Vector3.distance(
          Vector3.add(g.point, Quaternion.rotateVector(g.rotation!, c)),
          Vector3.add(
            foot.worldPosition,
            Quaternion.rotateVector(foot.worldRotation, c),
          ),
        ),
      );
    });
    return { rows, legs };
  };
  const q: number[] = initial.map((v, i) =>
    Math.max(lo[i]!, Math.min(hi[i]!, v)),
  );
  let at: ITrial = residual(q);
  const cost = (values: readonly number[]): number =>
    values.reduce((sum, v) => sum + v * v, 0);
  const positionalResolution: number =
    body.measure.stature * Math.sin(ROM_TOLERANCE * RAD);
  while (Math.max(...at.rows.map(Math.abs)) > positionalResolution) {
    const gradients = q.map((_, i) => {
      const moved = q.slice();
      moved[i]! += ROM_TOLERANCE;
      return residual(moved).rows.reduce(
        (s, v, j) => s + ((v - at.rows[j]!) * at.rows[j]!) / ROM_TOLERANCE,
        0,
      );
    });
    const largest: number = Math.max(...gradients.map(Math.abs));
    if (largest === 0) break;
    const best: number = cost(at.rows);
    let accepted: boolean = false;
    for (let step = (hi[0] - lo[0]) / 2; step >= ROM_TOLERANCE; step /= 2) {
      const next = q.map((v, i) =>
        Math.max(
          lo[i]!,
          Math.min(hi[i]!, v - (step * gradients[i]!) / largest),
        ),
      );
      if (next.every((v, i) => Math.abs(v - q[i]!) < ROM_TOLERANCE)) continue;
      const trial: ITrial = residual(next);
      if (cost(trial.rows) >= best) continue;
      q.splice(0, q.length, ...next);
      at = trial;
      accepted = true;
      break;
    }
    if (!accepted) break;
  }
  const peak: IAutoMovieMotionHumanPosture = trunk(at.legs, q);
  return (p, share, standing) => {
    const joints = { ...p.joints };
    for (const bone of ["spine", "chest"] as const) {
      const old = nominal.joints[bone] ?? [0, 0, 0],
        dest = peak.joints[bone]!,
        now = p.joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        now[0] + share * (dest[0] - old[0]),
        now[1] + share * (dest[1] - old[1]),
        now[2] + share * (dest[2] - old[2]),
      ];
    }
    if (share === 0) return p;
    const result: IAutoMovieMotionHumanPosture = {
      ...p,
      pitch: p.pitch + share * (peak.pitch - nominal.pitch),
      roll: p.roll + share * (peak.roll - nominal.roll),
      joints,
    };
    const currentAnkle = Vector3.lerp(
      p.limbs.leftLeg!.point,
      p.limbs.rightLeg!.point,
      0.5,
    );
    const standingHips = hipJoints(
      body,
      standing.root,
      humanPostureHeading(standing),
      standing.joints.hips,
    );
    const start = Vector3.lerp(standingHips.left, standingHips.right, 0.5);
    const startAnkle = Vector3.lerp(
      standing.limbs.leftLeg!.point,
      standing.limbs.rightLeg!.point,
      0.5,
    );
    const local = HumanFrame.local(
      { origin: startAnkle, yaw: standing.yaw },
      start,
    );
    const flex =
      startShank +
      ((q[1]! + bendLower.HEEL[strategy]) * RAD - startShank) * share;
    const thigh =
      startThigh +
      ((q[0]! - q[1]! - bendLower.HEEL[strategy]) * RAD - startThigh) * share;
    const aim = HumanFrame.point(
      { origin: currentAnkle, yaw: p.yaw },
      {
        x: local.x * (1 - share),
        y:
          body.measure.shank * Math.cos(flex) +
          body.measure.thigh * Math.cos(thigh) +
          (local.y -
            body.measure.shank * Math.cos(startShank) -
            body.measure.thigh * Math.cos(startThigh)) *
            (1 - share),
        z:
          body.measure.shank * Math.sin(flex) -
          body.measure.thigh * Math.sin(thigh) +
          (local.z -
            body.measure.shank * Math.sin(startShank) +
            body.measure.thigh * Math.sin(startThigh)) *
            (1 - share),
      },
    );
    const hips = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      humanPostureHeading(result),
      result.joints.hips,
    );
    return kneePlanes(body, {
      ...result,
      root: Vector3.subtract(aim, Vector3.lerp(hips.left, hips.right, 0.5)),
    });
  };
}

/** Intersect each two-link knee circle with its foot's sagittal plane. */
function kneePlanes(
  body: IAutoMovieMotionHumanBody,
  original: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  const hips = hipJoints(
    body,
    original.root,
    humanPostureHeading(original),
    original.joints.hips,
  );
  const limbs = { ...original.limbs };
  for (const side of SIDES) {
    const goal = limbs[`${side}Leg`]!;
    const frame = { origin: goal.point, yaw: original.yaw };
    const hip = HumanFrame.local(frame, hips[side]),
      length = Math.hypot(hip.y, hip.z);
    if (length === 0) continue;
    const leg = body.measure.shank,
      thigh = body.measure.thigh;
    const along =
      (leg * leg - thigh * thigh + hip.x * hip.x + length * length) /
      (2 * length);
    const across = Math.sqrt(Math.max(0, leg * leg - along * along));
    const knee = HumanFrame.point(frame, {
      x: 0,
      y: (along * hip.y - across * hip.z) / length,
      z: (along * hip.z + across * hip.y) / length,
    });
    limbs[`${side}Leg`] = { ...goal, bend: knee };
  }
  return { ...original, limbs };
}
