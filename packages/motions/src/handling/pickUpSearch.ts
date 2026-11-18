import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspSearch } from "./HumanGraspSearch";
import { HumanGraspDemand } from "./HumanGraspDemand";
import { HumanGraspUse } from "./HumanGraspUse";
import { pickUpPosture } from "./pickUpPosture";

/**
 * The grasp a pick up chooses from a stance (`pickUp`): the grip's turn and
 * tilt the arm reaches best, judged by the fit over the grasp, the lifted
 * pose and any use's pose. Without a use, the grip is taken as the
 * archetype declares it: untilted, and turned only within its declared
 * symmetry (`TURNS`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is chosen and by what.
 * @evidence contracts/development/design.md#principled-representation The search result as one record of the chosen grasp, the elbow hint and the stance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and the search the pick up reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop is named: the grip is the prop's declared affordance.
 */
export namespace pickUpSearch {
  /** The turns about the wrapped axis a grip is taken at without a use, degrees, by its declared symmetry: any side of a round grip, in steps of 15, the two sides of a half-symmetric one, and only the declared side of the rest. */
  export const TURNS: Readonly<
    Record<NonNullable<IAutoMovieAffordance["symmetry"]>, readonly number[]>
  > = {
    round: Array.from(
      { length: 24 },
      (_: unknown, i: number): number => -180 + 15 * i,
    ),
    half: [0, 180],
    none: [0],
  };

  /**
   * A grasp chosen from its actual stance and hanging elbow hint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members identify the original chosen reach, world-metre elbow hint and exact body stance that produced them.
   * @evidence contracts/development/design.md#principled-representation Retains HumanGrasp's reach and pickUpPosture's stance types with their original world coordinates, complete goals, reference and judgement reports.
   * @evidence contracts/development/design.md#minimal-and-owned-surface pickUpStance chooses among these records and pickUp consumes all three fields to author the original lift; no prepared token or new pose representation escapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every record comes from its own actual stance search, without reusing another stance's wrist, goal, solution or refusal verdict.
   */
  export interface ISearched {
    /** The grasp the arm reaches best. */
    chosen: IAutoMovieMotionHumanGrasp.IReach;

    /** The elbow hint the arm hangs by, world metres. */
    bend: IAutoMovieVector3;

    /** The body the arm reaches from. */
    stance: pickUpPosture.IStance;
  }

  /**
   * The grasp the arm reaches best from a stance's posture, the lifted pose and any use's pose its keys (`HumanGrasp.reachable`).
   *
   * @param context The pick up's context.
   * @param side The reaching hand.
   * @param lift How far the prop is lifted, metres.
   * @param authored The grip as the prop declares it.
   * @param stance The body the arm reaches from.
   * @returns The chosen grasp, the elbow hint and the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The grip's turns and tilts judged by the arm's fit over the grasp, the lift and any use's pose (`HumanGrasp.reachable`), the use's pose first when one is asked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The elbow hint, the goals, one search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grasp beyond the straight arm is tried only when every one is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preserves all original candidate goals, coupled fits, lazy stroke keys and required-first wider search. Each candidate that reaches a use or demand reads its current geometry at that original point; arbitrary callbacks prevent sharing direct source assembly across fits or stances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The public reachable owner shares only exact current FK dependencies. Entry, params, prop reads and demanded postures remain live across external demand callbacks; no object identity or callback absence is treated as proof of a fixed body/posture source.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
    side: AutoMovieHumanSide,
    lift: number,
    authored: IAutoMovieMotionHumanGrasp.ITarget,
    stance: pickUpPosture.IStance,
  ): ISearched {
    const body: IAutoMovieMotionHumanBody = context.body;
    const held: IAutoMovieMotionHumanPosture = stance.posture;

    // The same grip must still hold at the top of the lift, so the lifted
    // pose is a key of the choice.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );

    // Without a use, the hand takes the grip as the archetype declares it:
    // never tilted, and turned about the wrapped axis only as far as the
    // grip is the same turned (`IAutoMovieAffordance.symmetry`).
    const goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist = (turn: number, tilt: number): IAutoMovieMotionHumanHand.IWrist =>
      HumanGrasp.hand(body, side, HumanGrasp.around(authored, turn), tilt);
    const declared: readonly number[] = TURNS[
      context
        .prop(context.params.prop)
        .prop.affordances?.find(
          (a: IAutoMovieAffordance): boolean =>
            a.id === context.params.handle,
        )?.symmetry ?? "none"
    ];

    // The keys a grip must hold besides the grasp: the lifted pose, any
    // use's pose, and every pose the performer's next action on the prop
    // demands of it (`HumanGraspDemand`), asked from the body the pick up
    // ends in, its stance straightened back up.
    const demands: IAutoMovieMotionHumanActionContext["demands"] = context.demands;
    const after: IAutoMovieMotionHumanPosture = stance.at(0);

    // What a grip must hold: every judged key within its own bound (the
    // demanding action's, or the held tool's for a use), measured as the
    // worst judgement's share of its bound; the grasp's and the lift's are
    // unjudged.
    const required: Parameters<typeof HumanGrasp.reachable>[8] =
      context.params.use === undefined && demands === undefined
        ? undefined
        : {
            bound: 1,
            measure: (
              _keys: readonly number[],
              judged: readonly number[],
              bounds: readonly number[],
            ): number =>
              judged.reduce(
                (worst: number, j: number, i: number): number =>
                  Number.isNaN(j)
                    ? worst
                    : Math.max(
                        worst,
                        j /
                          (Number.isFinite(bounds[i])
                            ? bounds[i]!
                            : StrikingRoll.MISS),
                      ),
                0,
              ),
          };

    // The keys of a candidate, built only as the search reaches them: the
    // lifted pose, any use's pose, then the next action's demands, whose
    // grip is read for this candidate alone.
    const stroke: (wrist: IAutoMovieMotionHumanHand.IWrist, shown: IAutoMovieMotionHumanHand.IWrist) => Generator<IAutoMovieMotionHumanGrasp.IKey> = function* (
      wrist: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ): Generator<IAutoMovieMotionHumanGrasp.IKey> {
      if (lift > 0)
        yield {
          posture: held,

          // Lifted, the complete position/rotation goal asks the hand to
          // keep the rotation it shows at the grasp, as the plan does.
          wrist: {
            point: { ...wrist.point, y: wrist.point.y + lift },
            rotation: shown.rotation,
          },
          bend,
        };
      if (context.params.use !== undefined)
        yield HumanGraspUse.presented({
          context, prop: context.params.prop, handle: context.params.handle,
          side, wrist: shown, use: context.params.use,
        });
      if (demands !== undefined)
        for (const demand of demands(HumanGraspDemand.grip(
          context, context.params.prop, side, shown, after,
        )))
          yield HumanGraspDemand.key(body, demand);
    };

    // A grasp whose wrist lies beyond the straight arm is tried only when
    // every one does: the choice and the refusal below read the same reach,
    // so a grip a millimetre beyond it is never chosen over one within it for
    // a cheaper fit. Each turn and tilt is judged on its own; a turn kept
    // only while all its tilts were within reach fell back to every turn when
    // none kept all seven, and a glass across the body was refused a grip
    // 9 mm beyond the arm while others lay within it.
    const reachable: ReturnType<typeof HumanGraspSearch> = HumanGraspSearch(body, held, side, bend, true);
    const admits: ReturnType<typeof pickUpPosture.reaches> = pickUpPosture.reaches(context, side, held);
    const search: (tilts: readonly number[], turns: readonly number[]) => IAutoMovieMotionHumanGrasp.IReach = (
      tilts: readonly number[],
      turns: readonly number[],
    ): IAutoMovieMotionHumanGrasp.IReach =>
      reachable(
        goal,
        tilts,
        stroke,
        turns,
        // A grasp that holds every judged key comes before any that does
        // not, whatever else each costs.
        required,
        admits,
      );

    // A use may need the far side of the handle, so it searches every turn
    // and tilt. A next action's demands are asked of the grip as declared
    // first, and the search widens only when no declared grip holds them.
    const chosen: IAutoMovieMotionHumanGrasp.IReach =
      context.params.use !== undefined
        ? search(HumanGraspUse.OBLIQUE, HumanGraspUse.AROUND)
        : ((): IAutoMovieMotionHumanGrasp.IReach => {
            const first: IAutoMovieMotionHumanGrasp.IReach = search([0], declared);
            return required === undefined ||
              required.measure(first.keys, first.judged, first.bounds) <=
                required.bound
              ? first
              : search(HumanGraspUse.OBLIQUE, HumanGraspUse.AROUND);
          })();
    return { chosen, bend, stance };
  }
}
