import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { bend } from "../everyday/bend";
import { bendLower } from "../everyday/bendLower";
import { seated } from "../everyday/seated";
import type { HumanBase } from "../law/HumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The body a pick up reaches from, and the reach it reads.
 *
 * A grip the arm reaches from the posture the action is entered in is taken
 * from that posture. A grip it does not reach, from a standing body, is
 * taken by lowering the body the way the bend law lowers it, the strategy
 * chosen from the grip's height (`bend.lowering`): a stoop that inclines
 * the trunk only as far as the shoulder must come to the grip, a slight lean
 * at a counter, a deep one at a low shelf, a semi-squat below mid-shank and
 * a squat where that cannot reach, the hips moved back to keep the body over
 * its feet. Whole-body reaching apportions the movement among the legs, the
 * trunk and the arm under two constraints, the hand on the target and the
 * centre of mass over the base of support (Sha and Thomas 2011,
 * arXiv:1108.1940), and the posture people choose between a stoop and a
 * squat depends on the height of what they take (Burgess-Limerick et al.
 * 2001, Hum Mov Sci 20:549). A grip a seated body does not reach is taken
 * by leaning the trunk forward from the seat, the feet and the seat kept
 * (`SEATED_LEAN`). A grip no lowering or lean reaches, or one beyond the arm
 * from a body that neither stands nor sits, is refused: the person stands
 * and steps closer first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the body is lowered, how, the sources and the refusals.
 * @evidence contracts/development/design.md#principled-representation The reach as a predicate over wrist goals and the lowered body as a function of the share of the way down, so the law's grasp search and its postures read one body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance record, its builder and the reach predicate and refusal the pick up and the put down read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No height or body is special-cased: the strategy and the inclination are the bend law's own solve.
 */
export namespace pickUpPosture {
  /** The furthest a seated trunk leans forward from the seat to reach, degrees: a search bound (provisional: no source gives the trunk's angle from vertical at a seated reach's limit; a seated pick up from the floor flexes the lumbar spine about 50 degrees, Shum, Crosbie and Lee 2007, Eur Spine J 16:749, Table 2), the reach itself bounded by `SEATED_REACH`. */
  export const SEATED_LEAN: number = 60;

  /** How far a seated person reaches from the shoulder, shares of the arm's length (acromion to fingertip, the hand included), straight ahead and to the reaching arm's side: 163.3 and 125.2 percent (Haas et al. 2023, PLoS One 18:e0289115, Table 4, 15 healthy adults on a stable seat, feet supported); between them the squared cosine and sine of the angle from the facing blend them. */
  export const SEATED_REACH: readonly [number, number] = [1.633, 1.2515];

  /** The body a pick up reaches from. */
  export interface IStance {
    /** The posture at the bottom: the entry's, or the entry lowered. */
    posture: IHumanPosture;

    /** The body at a share of the way down, from the entry at 0 to `posture` at 1. */
    at: (share: number) => IHumanPosture;

    /** Any posture of the same base lowered or leaned the same way, a share of it: the lowering carried onto a body that walks. */
    lower: (posture: IHumanPosture, share: number) => IHumanPosture;
  }

  /**
   * The entry's body lowered until the arm reaches a grip; a seated body is leaned instead.
   *
   * @param context The action's context; its entry posture is lowered.
   * @param side The reaching arm.
   * @param grip The grip point, world metres.
   * @param reach How near the shoulder must come to the grip, metres; a palm laid on it when absent (`bendLower.pitch`).
   * @returns The lowered stance.
   * @throws {HumanRefusal} When the entry neither stands nor sits, or no lowering or lean brings the shoulder within reach: the person stands and steps closer first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, toward what and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The bend law's choice and solve (`bend.lowering`) and its lowered posture (`bendLower.lower`), the trunk's inclination and the hips' shift both taken a share of the way at each instant, as the bend lowers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the base, one solve and one closure; a seated body goes to its lean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body that is not standing is not lowered from a standing rule (a seated one leans from its seat); a refusal of the solve is passed on with the step named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lowering solve per plan; each instant one lowered posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the bend law's lowering, so a bend and a pick up lower a body alike.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds the entry posture and the solved lowering.
   */
  export function lowered(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    grip: IAutoMovieVector3,
    reach?: number,
  ): IStance {
    const entry: IHumanPosture = context.entry.posture;
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
    let solved: bendLower.ISolved;
    try {
      solved = bend.lowering(context.body, entry, grip, side, "auto", reach);
    } catch (error) {
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: grip.y,
        reason: `${context.subject}: no stoop or squat brings the ${side} hand to the grip at ${grip.y.toFixed(3)} m high, ${Vector3.length({ ...Vector3.subtract(grip, shoulder(context, side, entry)), y: 0 }).toFixed(3)} m from the shoulder across the floor (${(error as Error).message})`,
        fix: "step closer to the prop first",
      });
    }
    const lower = (posture: IHumanPosture, share: number): IHumanPosture =>
      bendLower.lower(
        context.body,
        posture,
        solved.strategy,
        solved.pitch * share,
        share,
        solved.lean * Math.sin((solved.pitch * share * Math.PI) / 180),
      );
    const at = (share: number): IHumanPosture => lower(entry, share);
    return { posture: at(1), at, lower };
  }

  /**
   * A seated body leaned forward until the arm reaches a grip: the trunk
   * inclines about the seat, the pelvis and the spine sharing the lean
   * (`HumanTrunk.incline`), the seat socket kept on the seat and the feet
   * where they rest, as a seated person reaches past the arm by leaning
   * (`SEATED_LEAN`), up to the seated reach (`SEATED_REACH`). The least lean
   * that brings the shoulder within the reach is taken.
   *
   * @param context The action's context; its entry is seated.
   * @param side The reaching arm.
   * @param grip The grip point, world metres.
   * @param reach How near the shoulder must come to the grip, metres; the upper arm and the forearm together when absent.
   * @returns The leaned stance.
   * @throws {HumanRefusal} When the grip lies beyond the seated reach, or no lean up to `SEATED_LEAN` brings the shoulder within reach: the person stands and steps closer first.
   */
  const leaned = (
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    grip: IAutoMovieVector3,
    reach?: number,
  ): IStance => {
    const entry: IHumanPosture = context.entry.posture;
    const base: HumanBase = context.entry.base;
    if (base.kind !== "seated")
      throw new Error("A seated lean of a body that is not seated");
    const limit: number =
      reach ?? context.body.measure.upperArm + context.body.measure.forearm;
    const lower = (posture: IHumanPosture, pitch: number): IHumanPosture => {
      if (pitch <= 0) return posture;
      const socket: IAutoMovieVector3 = seated.socket(context.body, posture);
      const tilt: { pitch: number; joints: IHumanPosture["joints"] } =
        HumanTrunk.incline(posture.joints, pitch);
      const heading: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> = {
        yaw: posture.yaw,
        pitch: posture.pitch + tilt.pitch,
        roll: posture.roll,
      };
      const leant: IHumanPosture = resolveHumanPosture.lower(context.body, {
        ...posture,
        ...heading,
        root: seated.root(context.body, socket, heading),
        joints: tilt.joints,
      });
      // A free hand rests where the leaned body sets it, on the thigh or
      // the armrest, as it rested sitting; a hand that holds keeps its goal.
      const rested: IHumanPosture = seated.rested(
        context.body,
        leant,
        base.seat?.armrests,
        posture.yaw,
        1,
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
      const limbs: IHumanPosture["limbs"] = { ...leant.limbs };
      for (const hand of ["left", "right"] as const) {
        const goal: IHumanPosture.IGoal | undefined =
          rested.limbs[`${hand}Arm`];
        if (context.entry.holds[hand] !== undefined || goal === undefined)
          continue;
        const slide: number = Math.min(
          0.5 * context.body.measure.thigh,
          Math.max(
            0,
            Vector3.dot(
              Vector3.subtract(
                shoulder(context, hand, leant),
                shoulder(context, hand, posture),
              ),
              ahead,
            ),
          ),
        );
        limbs[`${hand}Arm`] = {
          ...goal,
          point: Vector3.add(goal.point, Vector3.scale(ahead, slide)),
        };
      }
      return { ...leant, limbs };
    };
    const far = (pitch: number): number =>
      Vector3.length(
        Vector3.subtract(grip, shoulder(context, side, lower(entry, pitch))),
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
    if (far(SEATED_LEAN) > limit)
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: far(SEATED_LEAN),
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
        reason: `${context.subject}: the grip lies ${far(SEATED_LEAN).toFixed(3)} m from the ${side} shoulder even with the trunk leaned ${SEATED_LEAN} degrees forward from the seat, beyond the arm's ${limit.toFixed(3)} m; stand and step closer first`,
        fix: "stand and step closer first, or bring the prop within the seated reach",
      });
    // The least lean that reaches, by bisection.
    let low: number = 0;
    let high: number = SEATED_LEAN;
    for (let i: number = 0; i < 30 && high - low > 0.01; i++) {
      const middle: number = (low + high) / 2;
      if (far(middle) <= limit) high = middle;
      else low = middle;
    }
    const pitch: number = far(0) <= limit ? 0 : high;
    const at = (share: number): IHumanPosture => lower(entry, pitch * share);
    return {
      posture: at(1),
      at,
      lower: (posture: IHumanPosture, share: number): IHumanPosture =>
        lower(posture, pitch * share),
    };
  };

  /**
   * Whether a wrist goal lies within the straight arm's reach from its
   * shoulder in a posture: the reach `reachable` refuses beyond, for a grasp
   * search to admit by (`HumanGrasp.reachable`'s `admits`), so the search
   * never chooses a wrist the law then refuses.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param posture The posture the arm reaches from; the entry's when absent.
   * @returns Whether a wrist goal is within reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reach, the posture it is read in and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation The upper arm and the forearm together, from the shoulder the posture places.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder read and one distance per goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is a micrometre, the one `reachable` refuses by.
   * @evidence contracts/development/implementation.md#efficient-algorithms The shoulder is resolved once per call, not per goal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `reachable` and by the pick-up's and the put-down's grasp searches.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The predicate closes over the shoulder and the reach.
   */
  export function reaches(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    posture: IHumanPosture = context.entry.posture,
  ): (wrist: HumanHand.IWrist) => boolean {
    const from: IAutoMovieVector3 = shoulder(context, side, posture);
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    return (wrist: HumanHand.IWrist): boolean =>
      Vector3.length(Vector3.subtract(wrist.point, from)) <= limit + 1e-6;
  }

  /**
   * Refuse a wrist goal beyond the straight arm's reach from its shoulder in
   * a posture.
   *
   * @param context The action's context.
   * @param side The arm.
   * @param wrist The wrist goal, world metres.
   * @param posture The posture the arm reaches from; the entry's when absent.
   * @throws {HumanRefusal} When the goal is farther than the upper arm and forearm together: the person bends or steps closer first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reach, the posture and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The upper arm and the forearm together, from the shoulder the posture places.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is a micrometre; nothing is clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the shoulder as `reaches` does.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reachable(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    wrist: IAutoMovieVector3,
    posture: IHumanPosture = context.entry.posture,
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
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(context.body, posture).get(`${side}UpperArm`)!
      .worldPosition;
}
