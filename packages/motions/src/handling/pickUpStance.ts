import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanGrasp } from "./HumanGrasp";
import type { pickUp } from "./pickUp";
import { pickUpAdjust } from "./pickUpAdjust";
import { pickUpLift } from "./pickUpLift";
import { pickUpPosture } from "./pickUpPosture";
import { pickUpSearch } from "./pickUpSearch";

/**
 * The body a pick up takes its grip and makes its lift from (`pickUp`).
 *
 * The grasp is chosen from the entry's body. Where the arm does not reach
 * it, the body is lowered toward the grip (`pickUpPosture`); still out of
 * reach, the trunk turns toward it, and a standing body takes one
 * adjustment step (`pickUpAdjust`). The lift is then carried by the arm,
 * the trunk or the stance's straightening (`pickUpLift.raise`). Where none
 * of them carries it, a standing body takes its one step for the whole
 * task, the grasp and the lifted place together, since a person who must
 * lift a thing steps where the lift can be made, not only the grasp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each stage, its order and the step taken for the whole task.
 * @evidence contracts/development/design.md#principled-representation The chosen grasp, the stance it was taken from and the raise, as the plan reads them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and one function the pick up reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every stage is its owner's own solve: the lowering's, the turn's, the step's and the raise's.
 */
export namespace pickUpStance {
  /**
   * The body a pick up acts from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   * @evidence contracts/development/design.md#principled-representation The three results the plan builds its postures from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by the plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An entry the body never left is a null stance, not an empty one.
   */
  export interface IChosen {
    /** The grasp chosen from the stance. */
    found: pickUpSearch.ISearched;

    /** The stance the body lowered, turned or stepped into; null where it reached from the entry. */
    lowered: pickUpPosture.IStance | null;

    /** How the body carries the lift; `pickUpLift.ARM` where the arm alone does, or where nothing does and the plan's hand is left to the lift's judgement. */
    raise: pickUpLift.IRaise;
  }

  /**
   * The body a pick up acts from.
   *
   * @param context The pick up's context.
   * @param side The reaching arm.
   * @param lift The asked lift, metres.
   * @param authored The grip as the archetype declares it.
   * @returns The grasp, the stance and the raise.
   * @throws {HumanRefusal} When the entry neither stands nor sits and the grip is beyond the arm, or the lowering refuses a body that does not stand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stages and the refusals passed on.
   * @evidence contracts/development/implementation.md#principled-implementation Each stage runs only where the one before leaves the grip, or the lift, out of reach, and the grasp is chosen again from each stance taken.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The stages in order, each one guarded by the same reach test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A standing body's lowering refusal falls through to the turn and the step; any other is passed on.
   * @evidence contracts/development/implementation.md#efficient-algorithms One grasp search per stance taken: at most four, and one more for each grip side the step for the lift is solved for, each side at most once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The stance owners' solves and the grasp search, reused.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
   */
  export function of(
    context: IHumanActionContext<pickUp.IParams>,
    side: HumanHand.Side,
    lift: number,
    authored: HumanGrasp.ITarget,
  ): IChosen {
    const missed = (found: pickUpSearch.ISearched): boolean =>
      !pickUpPosture.reaches(
        context,
        side,
        found.stance.posture,
      )(found.chosen.wrist);

    // The grasp chosen from the entry's body; where its arm does not reach,
    // from the body lowered toward the grip (`pickUpPosture`).
    let found: pickUpSearch.ISearched = pickUpSearch.of(
      context,
      side,
      lift,
      authored,
      {
        posture: context.entry.posture,
        at: (): IHumanPosture => context.entry.posture,
        lower: (posture: IHumanPosture): IHumanPosture => posture,
      },
    );
    // A standing body no stoop or squat brings to the grip may still turn
    // or step toward it, below; anything else the lowering refuses stands.
    const standing: boolean = context.entry.base.kind === "standing";
    let lowered: pickUpPosture.IStance | null = null;
    if (missed(found))
      try {
        lowered = pickUpPosture.lowered(context, side, authored.point);
      } catch (error) {
        if (!(standing && error instanceof HumanRefusal)) throw error;
      }
    if (lowered !== null)
      found = pickUpSearch.of(context, side, lift, authored, lowered);

    // Still out of reach, the trunk turns toward the grip first.
    if (missed(found)) {
      lowered = pickUpAdjust.turned(
        context,
        side,
        found.chosen.wrist.point,
        found.stance,
      );
      found = pickUpSearch.of(context, side, lift, authored, lowered);
    }

    // Still out of reach, one foot takes one adjustment step toward it; and
    // where the lift is still out of reach of every freedom of the body,
    // the step is taken for the grasp and the lift together.
    const before: pickUpSearch.ISearched = found;
    const step = (
      lifted?: IAutoMovieVector3,
    ): Omit<IChosen, "raise"> | null => {
      const stepped: pickUpPosture.IStance | null = pickUpAdjust.stepped(
        context,
        side,
        before.chosen.wrist.point,
        before.stance,
        lifted,
      );
      return stepped === null
        ? null
        : {
            lowered: stepped,
            found: pickUpSearch.of(context, side, lift, authored, stepped),
          };
    };
    if (standing && missed(found)) {
      const taken: Omit<IChosen, "raise"> | null = step();
      if (taken !== null) ({ found, lowered } = taken);
    }
    if (lift <= 0) return { found, lowered, raise: pickUpLift.ARM };
    const place = (searched: pickUpSearch.ISearched): IAutoMovieVector3 => ({
      ...searched.chosen.wrist.point,
      y: searched.chosen.wrist.point.y + lift,
    });
    const raise: pickUpLift.IRaise | null = pickUpLift.raise(
      context,
      side,
      place(found),
      lowered,
      found.stance.posture,
    );
    if (raise !== null || !standing)
      return { found, lowered, raise: raise ?? pickUpLift.ARM };

    // The step and the grasp hang on each other: the stepped body may take
    // the grip from another side, whose lifted place lies elsewhere. The
    // step is solved again for the grasp the stepped body takes, until it
    // takes one already stepped for.
    const tried: string[] = [];
    let last: Omit<IChosen, "raise"> | null = null;
    let source: pickUpSearch.ISearched = before;
    while (!tried.includes(`${source.chosen.turn}/${source.chosen.tilt}`)) {
      tried.push(`${source.chosen.turn}/${source.chosen.tilt}`);
      const whole: Omit<IChosen, "raise"> | null = step(place(source));
      if (whole === null) break;
      const carried: pickUpLift.IRaise | null = pickUpLift.raise(
        context,
        side,
        place(whole.found),
        whole.lowered,
        whole.found.stance.posture,
      );
      if (carried !== null) return { ...whole, raise: carried };
      last = whole;
      source = whole.found;
    }
    return { ...(last ?? { found, lowered }), raise: pickUpLift.ARM };
  }
}
