import { Quaternion, Vector3, bracketedBisection } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bend } from "../everyday/bend";
import { bendLower } from "../everyday/bendLower";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";

/** The alternatives of `LeanedLeanBodyHeading`'s site. */
type LeanedLeanBodyHeading = "yaw" | "pitch" | "roll";

/** The record of `ILeanedLeanBodyTilt`'s site. */
type ILeanedLeanBodyTilt = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};

/** The record of `IStanceStep`'s site. */
type IStanceStep = { side: AutoMovieHumanSide; off: number; on: number };

/**
 * The body a pick up reaches from, and the reach it reads.
 *
 * A grip the arm reaches from the posture the action is entered in is taken
 * from that posture. A grip it does not reach, from a standing body, is taken
 * by lowering the body the way the bend law lowers it, the strategy chosen from
 * the grip's height (`bend.lowering`): a stoop that inclines the trunk only as
 * far as the shoulder must come to the grip, a slight lean at a counter, a deep
 * one at a low shelf, a semi-squat below mid-shank and a squat where that
 * cannot reach, the hips moved back to keep the body over its feet. Whole-body
 * reaching apportions the movement among the legs, the trunk and the arm under
 * two constraints, the hand on the target and the centre of mass over the base
 * of support (Sha and Thomas 2011, arXiv:1108.1940), and the posture people
 * choose between a stoop and a squat depends on the height of what they take
 * (Burgess-Limerick et al. 2001, Hum Mov Sci 20:549). A grip a seated body does
 * not reach is taken by leaning the trunk forward from the seat, the feet and
 * the seat kept (`SEATED_LEAN`). A grip no lowering or lean reaches, or one
 * beyond the arm from a body that neither stands nor sits, is refused: the
 * person stands and steps closer first.
 */
export namespace pickUpPosture {
  /** The lowerings a pick-up's stance is chosen among, in its order. */
  export type Lowering = "auto" | "squat";

  /**
   * The furthest a seated trunk leans forward from the seat to reach, degrees:
   * a search bound (provisional: no source gives the trunk's angle from
   * vertical at a seated reach's limit; a seated pick up from the floor flexes
   * the lumbar spine about 50 degrees, Shum, Crosbie and Lee 2007, Eur Spine J
   * 16:749, Table 2), the reach itself bounded by `SEATED_REACH`.
   */
  export const SEATED_LEAN: number = 60;

  /**
   * How far a seated person reaches from the shoulder, shares of the arm's
   * length (acromion to fingertip, the hand included), straight ahead and to
   * the reaching arm's side: 163.3 and 125.2 percent (Haas et al. 2023, PLoS
   * One 18:e0289115, Table 4, 15 healthy adults on a stable seat, feet
   * supported); between them the squared cosine and sine of the angle from the
   * facing blend them.
   */
  export const SEATED_REACH: readonly [number, number] = [1.633, 1.2515];

  /**
   * The original lowering, borrowing observations only for the current person
   * call.
   */
  export interface IStance {
    /** The posture at the bottom: the entry's, or the entry lowered. */
    posture: IAutoMovieMotionHumanPosture;

    /** The body at a share down, entry at zero and bottom at one. */
    at: (
      share: number,
      resolution?: IFK,
      projection?: IROM,
    ) => IAutoMovieMotionHumanPosture;

    /** Carry the lowering onto a current posture of the same base. */
    lower: (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      resolution?: IFK,
      projection?: IROM,
    ) => IAutoMovieMotionHumanPosture;

    /**
     * The adjustment step the stance takes, if any: the stepping foot and the
     * shares of the way down at which it leaves the floor and lands.
     */
    step?: IStanceStep;
  }

  /**
   * The entry's body lowered until the arm reaches a grip, the trunk leaned
   * toward a grip beside or behind the shoulder rather than pitched away from
   * it; a seated body is leaned instead.
   *
   * @param context The action's context; its entry posture is lowered.
   * @param side The reaching arm.
   * @param grip The grip point, world metres.
   * @param reach How near the shoulder must come to the grip, metres; a palm
   *   laid on it when absent (`bendLower.pitch`).
   * @returns The lowered stance.
   * @throws {HumanRefusal} When the entry neither stands nor sits, or no
   *   lowering or lean brings the shoulder within reach: the person stands and
   *   steps closer first.
   */
  export function lowered(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    grip: IAutoMovieVector3,
    reach?: number,
  ): IStance {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    if (context.entry.base.kind === "seated")
      return leaned(context, side, grip, reach);
    if (context.entry.base.kind !== "standing")
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: context.entry.base.kind,
        feasible: { kind: "alternatives", values: ["standing"] },
        reason: `${context.subject}: the grip at ${grip.y.toFixed(3)} m is beyond the ${side} arm from a ${context.entry.base.kind} body, which a pick up does not lower`,
        fix: "stand and step closer first, or bring the prop within the arm's reach",
      });
    // A grip level with or behind the reaching shoulder's frontal plane is
    // one a forward inclination only carries the shoulder away from, so the
    // trunk is directed toward it sideways, as the bend law aligns it with a
    // unilateral contact (`bendLower.lateralTilt`); a grip ahead keeps the
    // sagittal course.
    const lateral: number =
      HumanFrame.local({ origin: entry.root, yaw: entry.yaw }, grip).z <=
      context.body.rest.get(`${side}UpperArm`)!.z
        ? bendLower.lateralTilt(context.body, entry, grip, side)
        : 0;
    // The lowerings are the law's candidates in its order, the automatic
    // strategy and then the squat, each checked as Algorithm 1 checks a base
    // (`AutoMovieMotionHumanTouchStance.choose`): its arm reaches the grip
    // and its key keeps the trunk out of the thighs within the tangle
    // audit's skin, since the pick-up shows its key as solved. A squat
    // lowers the trunk on the knees and hips rather than folding the lumbar
    // spine onto the thighs (`bendLower.fold`; Kingma et al. 2010).
    const lowering = (
      strategy: pickUpPosture.Lowering,
    ): IAutoMovieMotionHumanBendLower.ISolved => {
      const candidate: IAutoMovieMotionHumanBendLower.ISolved = bend.lowering(
        context.body,
        entry,
        grip,
        side,
        strategy,
        reach,
        undefined,
        undefined,
        lateral,
      );
      const folded: number = bendLower.fold(
        context.body,
        entry,
        lateral,
        candidate,
      );
      if (folded > AutoMovieMotionHumanAuditSkin.BUILT)
        throw new HumanRefusal({
          kind: "reach",
          axis: "prop",
          value: folded,
          feasible: {
            kind: "range",
            minimum: null,
            maximum: AutoMovieMotionHumanAuditSkin.BUILT,
            unit: "m",
          },
          reason: `the ${candidate.strategy} folds the trunk ${(folded * 1000).toFixed(1)} mm into the thighs`,
          fix: "step closer to the prop first",
        });
      return candidate;
    };
    let solved: IAutoMovieMotionHumanBendLower.ISolved;
    try {
      solved = AutoMovieMotionHumanTouchStance.choose<
        pickUpPosture.Lowering,
        IAutoMovieMotionHumanBendLower.ISolved
      >({ candidates: ["auto", "squat"], reach: lowering });
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal)) throw error;
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: grip.y,
        feasible: error.feasible,
        reason: `${context.subject}: no stoop or squat brings the ${side} hand to the grip at ${grip.y.toFixed(3)} m high, ${Vector3.length({ ...Vector3.subtract(grip, shoulder(context, side, entry)), y: 0 }).toFixed(3)} m from the shoulder across the floor (${error.message})`,
        fix: "step closer to the prop first",
      });
    }
    const prepare: ReturnType<typeof bendLower.prepare> = bendLower.prepare(
      context.body,
      solved.strategy,
    );
    const lower: IStance["lower"] = (
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      resolution?: IFK,
    ): IAutoMovieMotionHumanPosture =>
      prepare(
        posture,
        solved.pitch * share,
        share,
        solved.lean * Math.sin((solved.pitch * share * Math.PI) / 180),
        resolution,
        lateral,
      );
    const at: IStance["at"] = (
      share: number,
      resolution?: IFK,
    ): IAutoMovieMotionHumanPosture => lower(entry, share, resolution);
    return { posture: at(1), at, lower };
  }

  /**
   * A seated body leaned forward until the arm reaches a grip: the trunk
   * inclines about the seat, the pelvis and the spine sharing the lean
   * (`HumanTrunk.incline`), the seat socket kept on the seat and the feet where
   * they rest, as a seated person reaches past the arm by leaning
   * (`SEATED_LEAN`), up to the seated reach (`SEATED_REACH`). The least lean
   * that brings the shoulder within the reach is taken.
   *
   * @param context The action's context; its entry is seated.
   * @param side The reaching arm.
   * @param grip The grip point, world metres.
   * @param reach How near the shoulder must come to the grip, metres; the upper
   *   arm and the forearm together when absent.
   * @returns The leaned stance.
   * @throws {HumanRefusal} When the grip lies beyond the seated reach, or no
   *   lean up to `SEATED_LEAN` brings the shoulder within reach: the person
   *   stands and steps closer first.
   */
  const leaned: (
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    grip: IAutoMovieVector3,
    reach?: number,
  ) => IStance = (
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    grip: IAutoMovieVector3,
    reach?: number,
  ): IStance => {
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
    type Bones = ReturnType<typeof poseBones> | undefined;
    let initial: Bones;
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
      const tilt: ILeanedLeanBodyTilt = HumanTrunk.incline(
        posture.joints,
        pitch,
      );
      const heading: Pick<IAutoMovieMotionHumanPosture, LeanedLeanBodyHeading> =
        {
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
    const lower: IStance["lower"] = (
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
      initial ??= poseBones(
        context.body,
        context.entry.pose,
        undefined,
        requested,
      );
      const wrist: IAutoMovieResolvedBone = initial.get(`${free}Hand`)!;
      const elbow: IAutoMovieResolvedBone = initial.get(`${free}LowerArm`)!;
      const slide: number = Math.min(
        0.5 * context.body.measure.thigh,
        Math.max(
          0,
          Vector3.dot(
            Vector3.subtract(
              shoulder(context, free, leant),
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
        Vector3.subtract(grip, shoulder(context, side, leanBody(entry, pitch))),
      );
    // The seated reach from the upright shoulder, ahead and aside.
    const from: IAutoMovieVector3 = shoulder(context, side, entry);
    const toward: number = Math.atan2(grip.x - from.x, grip.z - from.z);
    const off: number = toward - (entry.yaw * Math.PI) / 180;
    const extent: number =
      (context.body.measure.upperArm +
        context.body.measure.forearm +
        context.body.measure.hand) *
      (Math.cos(off) ** 2 * SEATED_REACH[0] +
        Math.sin(off) ** 2 * SEATED_REACH[1]);
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
    const farthestLean: number = far(SEATED_LEAN);
    if (farthestLean > limit)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: farthestLean,
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
        reason: `${context.subject}: the grip lies ${farthestLean.toFixed(3)} m from the ${side} shoulder even with the trunk leaned ${SEATED_LEAN} degrees forward from the seat, beyond the arm's ${limit.toFixed(3)} m; stand and step closer first`,
        fix: "stand and step closer first, or bring the prop within the seated reach",
      });
    // The least lean that reaches, by bisection to a hundredth of a degree.
    const pitch: number =
      far(0) <= limit
        ? 0
        : bracketedBisection(
            (lean: number): boolean => far(lean) > limit,
            0,
            SEATED_LEAN,
            0.01,
          );
    const at: IStance["at"] = (
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
  };

  /**
   * Whether a wrist goal lies within the straight arm's reach from its shoulder
   * in a posture: the reach `reachable` refuses beyond, for a grasp search to
   * admit by (`HumanGrasp.reachable`'s `admits`), so the search never chooses a
   * wrist the law then refuses.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param posture The posture the arm reaches from; the entry's when absent.
   * @returns Whether a wrist goal is within reach.
   */
  export function reaches(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture = context.entry.posture,
  ): (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean {
    const from: IAutoMovieVector3 = shoulder(context, side, posture);
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    return (wrist: IAutoMovieMotionHumanHand.IWrist): boolean =>
      Vector3.length(Vector3.subtract(wrist.point, from)) <= limit + 1e-6;
  }

  /**
   * Refuse a wrist goal beyond the straight arm's reach from its shoulder in a
   * posture.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param wrist The wrist goal, world metres.
   * @param posture The posture the arm reaches from; the entry's when absent.
   * @throws {HumanRefusal} When the goal is farther than the upper arm and
   *   forearm together: the person bends or steps closer first.
   */
  export function reachable(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    wrist: IAutoMovieVector3,
    posture: IAutoMovieMotionHumanPosture = context.entry.posture,
  ): void {
    const distance: number = Vector3.length(
      Vector3.subtract(wrist, shoulder(context, side, posture)),
    );
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    if (distance > limit + 1e-6)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: distance,
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
        reason: `${context.subject}: the grip lies ${distance.toFixed(3)} m from the ${side} shoulder, beyond the arm's ${limit.toFixed(3)} m; bend or step closer first`,
        fix: "bend or step closer first",
      });
  }

  /** The shoulder joint of an arm in a posture, world metres. */
  const shoulder = (
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(
      context.body,
      posture,
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    ).get(`${side}UpperArm`)!.worldPosition;
}

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
