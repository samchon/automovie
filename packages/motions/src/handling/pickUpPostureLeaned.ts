import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { pickUpPosture } from "./pickUpPosture";
import { pickUpPostureShoulder } from "./pickUpPostureShoulder";

/** The alternatives of `LeanedLeanBodyHeading`'s site. */
type LeanedLeanBodyHeading = "yaw" | "pitch" | "roll";

/** The record of `ILeanedLeanBodyTilt`'s site. */
type ILeanedLeanBodyTilt = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};

/**
 * Optional parent-owned exact FK source for this same current person
 * evaluation.
 */
type IFK = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2];

/**
 * Genuine current-person ROM projection borrowed only by actual solved
 * observations.
 */
type IROM = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3];

/** An arm owned by its side of the body. */
type Arm = `${AutoMovieHumanSide}Arm`;

/** A free arm may have no reachable thigh contact. */
type FreeGoal = IAutoMovieHumanLimbGoal | undefined;

/** Unset clinical angles hold their neutral coordinates. */
const ZERO: readonly [number, number, number] = [0, 0, 0];

/**
 * A seated body leaned forward until the arm reaches a grip: the trunk inclines
 * about the seat, the pelvis and the spine sharing the lean
 * (`HumanTrunk.incline`), the seat socket kept on the seat and the feet where
 * they rest, as a seated person reaches past the arm by leaning
 * (`SEATED_LEAN`), up to the seated reach (`SEATED_REACH`). The least lean that
 * brings the shoulder within the reach is taken.
 *
 * @param context The action's context; its entry is seated.
 * @param side The reaching arm.
 * @param grip The grip point, world metres.
 * @param reach How near the shoulder must come to the grip, metres; the upper
 *   arm and the forearm together when absent.
 * @returns The leaned stance.
 * @throws {HumanRefusal} When the grip lies beyond the seated reach, or no lean
 *   up to `SEATED_LEAN` brings the shoulder within reach: the person stands and
 *   steps closer first.
 */
export function pickUpPostureLeaned(
  context: IAutoMovieMotionHumanActionContext<object>,
  side: AutoMovieHumanSide,
  grip: IAutoMovieVector3,
  reach?: number,
): pickUpPosture.IStance {
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const base: IAutoMovieMotionHumanBase = context.entry.base;
  if (base.kind !== "seated")
    throw new Error("A seated lean of a body that is not seated");
  const limit: number =
    reach ?? context.body.measure.upperArm + context.body.measure.forearm;
  const free: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const freeArm: Arm = `${free}Arm`;
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${free}UpperArm`,
      `${free}LowerArm`,
      `${free}Hand`,
    ]);
  // The free arm as the entry shows it, the rest it slides on from.
  const initial: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    requested,
  );
  // Reach probes read only the trunk, so hand-rest goals belong to actual
  // output lowering rather than every discarded bisection trial.
  const leanBody: (
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    resolution?: IFK,
  ) => IAutoMovieMotionHumanPosture = (
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    resolution?: IFK,
  ): IAutoMovieMotionHumanPosture => {
    if (pitch <= 0) return posture;
    const socket: IAutoMovieVector3 = seated.socket(context.body, posture);
    const tilt: ILeanedLeanBodyTilt = HumanTrunk.incline(posture.joints, pitch);
    const heading: Pick<IAutoMovieMotionHumanPosture, LeanedLeanBodyHeading> = {
      yaw: posture.yaw,
      pitch: posture.pitch + tilt.pitch,
      roll: posture.roll,
    };
    return lowerHumanPosture(
      context.body,
      {
        ...posture,
        ...heading,
        root: seated.root(context.body, socket, heading),
        joints: tilt.joints,
      },
      undefined,
      resolution,
    );
  };
  const lower: pickUpPosture.IStance["lower"] = (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    resolution?: IFK,
    projection?: IROM,
  ): IAutoMovieMotionHumanPosture => {
    const angle: number = pitch * share;
    if (angle <= 0) return posture;
    const leant: IAutoMovieMotionHumanPosture = leanBody(
      posture,
      angle,
      resolution,
    );
    if (
      context.entry.holds[free] !== undefined ||
      base.seat?.armrests?.[free] !== undefined
    )
      return leant;

    // A free hand rests where the leaned body sets it, on the thigh or
    // the armrest, as it rested sitting; a hand that holds keeps its goal.
    // The rest is read from the leaned body's legs alone, as `seated.rested`
    // takes it: the arms' own goals would only be solved to be replaced.
    const rested: IAutoMovieMotionHumanPosture = seated.rested(
      context.body,
      {
        ...leant,
        limbs: {
          ...(leant.limbs.leftLeg === undefined
            ? {}
            : { leftLeg: leant.limbs.leftLeg }),
          ...(leant.limbs.rightLeg === undefined
            ? {}
            : { rightLeg: leant.limbs.rightLeg }),
        },
      },
      base.seat?.armrests,
      posture.yaw,
      1,
      resolution,
      projection,
    );
    // The hand slides forward on the thigh as far as the shoulder has come
    // forward, up to the knee, half a thigh ahead of the rest (provisional),
    // so the arm keeps the shape it rested in.
    const yaw: number = (posture.yaw * Math.PI) / 180;
    const ahead: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };
    const goal: FreeGoal = rested.limbs[freeArm];
    if (goal === undefined) return leant;
    const wrist: IAutoMovieResolvedBone = initial.get(`${free}Hand`)!;
    const elbow: IAutoMovieResolvedBone = initial.get(`${free}LowerArm`)!;
    const slide: number = Math.min(
      0.5 * context.body.measure.thigh,
      Math.max(
        0,
        Vector3.dot(
          Vector3.subtract(
            pickUpPostureShoulder(context, free, leant),
            initial.get(`${free}UpperArm`)!.worldPosition,
          ),
          ahead,
        ),
      ),
    );
    // Start and finish on the displayed entry arm. A new full thigh goal
    // at the first nonzero lean lets the swivel choose a different elbow.
    return {
      ...leant,
      limbs: {
        ...leant.limbs,
        [freeArm]: {
          ...goal,
          point: Vector3.lerp(
            wrist.worldPosition,
            Vector3.addScaled(goal.point, ahead, slide),
            share,
          ),
          rotation: Quaternion.slerp(
            wrist.worldRotation,
            goal.rotation ?? wrist.worldRotation,
            share,
          ),
          bend: Vector3.lerp(elbow.worldPosition, goal.bend, share),
          reference: {
            upper: entry.joints[`${free}UpperArm`] ?? ZERO,
            lower: entry.joints[`${free}LowerArm`] ?? ZERO,
          },
        },
      },
    };
  };
  const far: (pitch: number) => number = (pitch: number): number =>
    Vector3.length(
      Vector3.subtract(
        grip,
        pickUpPostureShoulder(context, side, leanBody(entry, pitch)),
      ),
    );
  // The seated reach from the upright shoulder, ahead and aside.
  const from: IAutoMovieVector3 = pickUpPostureShoulder(context, side, entry);
  const toward: number = Math.atan2(grip.x - from.x, grip.z - from.z);
  const off: number = toward - (entry.yaw * Math.PI) / 180;
  const extent: number =
    (context.body.measure.upperArm +
      context.body.measure.forearm +
      context.body.measure.hand) *
    (Math.cos(off) ** 2 * pickUpPosture.SEATED_REACH[0] +
      Math.sin(off) ** 2 * pickUpPosture.SEATED_REACH[1]);
  const away: number = Vector3.length(Vector3.subtract(grip, from));
  if (away > extent)
    throw new HumanRefusal({
      kind: "reach",
      axis: "prop",
      value: away,
      feasible: { kind: "range", minimum: 0, maximum: extent, unit: "m" },
      reason: `${context.subject}: the grip lies ${away.toFixed(3)} m from the ${side} shoulder, beyond the ${extent.toFixed(3)} m a seated person reaches by leaning; stand and step closer first`,
      fix: "stand and step closer first, or bring the prop within the seated reach",
    });
  const farthestLean: number = far(pickUpPosture.SEATED_LEAN);
  if (farthestLean > limit)
    throw new HumanRefusal({
      kind: "reach",
      axis: "prop",
      value: farthestLean,
      feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
      reason: `${context.subject}: the grip lies ${farthestLean.toFixed(3)} m from the ${side} shoulder even with the trunk leaned ${pickUpPosture.SEATED_LEAN} degrees forward from the seat, beyond the arm's ${limit.toFixed(3)} m; stand and step closer first`,
      fix: "stand and step closer first, or bring the prop within the seated reach",
    });
  // The least lean that reaches, by bisection to a hundredth of a degree.
  const pitch: number =
    far(0) <= limit
      ? 0
      : AutoMovieEngineMath.bracketedBisection(
          (lean: number): boolean => far(lean) > limit,
          0,
          pickUpPosture.SEATED_LEAN,
          0.01,
        );
  const at: pickUpPosture.IStance["at"] = (
    share: number,
    resolution?: IFK,
    projection?: IROM,
  ): IAutoMovieMotionHumanPosture =>
    lower(entry, share, resolution, projection);
  return {
    posture: at(1),
    at,
    lower,
  };
}
