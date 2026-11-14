import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { bend } from "../everyday/bend";
import { bendLower } from "../everyday/bendLower";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
 * 2001, Hum Mov Sci 20:549). A grip no lowering reaches, or one beyond the
 * arm from a body that is not standing, is refused: the person steps closer
 * first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the body is lowered, how, the sources and the refusals.
 * @evidence contracts/development/design.md#principled-representation The reach as a predicate over wrist goals and the lowered body as a function of the share of the way down, so the law's grasp search and its postures read one body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance record, its builder and the reach predicate and refusal the pick up and the put down read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No height or body is special-cased: the strategy and the inclination are the bend law's own solve.
 */
export namespace pickUpPosture {
  /** The body a pick up reaches from. */
  export interface IStance {
    /** The posture at the bottom: the entry's, or the entry lowered. */
    posture: IHumanPosture;

    /** The body at a share of the way down, from the entry at 0 to `posture` at 1. */
    at: (share: number) => IHumanPosture;
  }

  /**
   * The entry's body lowered until the arm reaches a grip.
   *
   * @param context The action's context; its entry posture is lowered.
   * @param side The reaching arm.
   * @param grip The grip point, world metres.
   * @returns The lowered stance.
   * @throws {HumanRefusal} When the entry is not standing, or no lowering brings the shoulder within reach: the person steps closer first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, toward what and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The bend law's choice and solve (`bend.lowering`) and its lowered posture (`bendLower.lower`), the trunk's inclination and the hips' shift both taken a share of the way at each instant, as the bend lowers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the base, one solve and one closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body that is not standing is not lowered from a standing rule; a refusal of the solve is passed on with the step named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lowering solve per plan; each instant one lowered posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the bend law's lowering, so a bend and a pick up lower a body alike.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds the entry posture and the solved lowering.
   */
  export function lowered(
    context: IHumanActionContext<object>,
    side: HumanHand.Side,
    grip: IAutoMovieVector3,
  ): IStance {
    const entry: IHumanPosture = context.entry.posture;
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
      solved = bend.lowering(context.body, entry, grip, side, "auto");
    } catch (error) {
      throw new HumanRefusal({
        kind: "reach",
        axis: "prop",
        value: grip.y,
        reason: `${context.subject}: no stoop or squat brings the ${side} hand to the grip at ${grip.y.toFixed(3)} m high, ${Vector3.length({ ...Vector3.subtract(grip, shoulder(context, side, entry)), y: 0 }).toFixed(3)} m from the shoulder across the floor (${(error as Error).message})`,
        fix: "step closer to the prop first",
      });
    }
    const at = (share: number): IHumanPosture =>
      bendLower.lower(
        context.body,
        entry,
        solved.strategy,
        solved.pitch * share,
        share,
        solved.lean * Math.sin((solved.pitch * share * Math.PI) / 180),
      );
    return { posture: at(1), at };
  }

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
