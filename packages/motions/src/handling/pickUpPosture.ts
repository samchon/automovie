import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanTouchStance } from "../compose/AutoMovieMotionHumanTouchStance";
import { bend } from "../everyday/bend";
import { bendLower } from "../everyday/bendLower";
import { bendLowerFold } from "../everyday/bendLowerFold";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { pickUpPostureLeaned } from "./pickUpPostureLeaned";
import { pickUpPostureShoulder } from "./pickUpPostureShoulder";

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
   *   laid on it when absent (`bendLowerPitch`).
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
      return pickUpPostureLeaned(context, side, grip, reach);
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
    // spine onto the thighs (`bendLowerFold`; Kingma et al. 2010).
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
      const folded: number = bendLowerFold(
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
        reason: `${context.subject}: no stoop or squat brings the ${side} hand to the grip at ${grip.y.toFixed(3)} m high, ${Vector3.length({ ...Vector3.subtract(grip, pickUpPostureShoulder(context, side, entry)), y: 0 }).toFixed(3)} m from the shoulder across the floor (${error.message})`,
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
    const from: IAutoMovieVector3 = pickUpPostureShoulder(
      context,
      side,
      posture,
    );
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
      Vector3.subtract(wrist, pickUpPostureShoulder(context, side, posture)),
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
