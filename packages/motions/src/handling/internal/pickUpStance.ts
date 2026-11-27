import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouchStance } from "../../compose/internal/AutoMovieMotionHumanTouchStance";
import { pickUpAdjust } from "./pickUpAdjust";
import { pickUpLift } from "./pickUpLift";
import { pickUpPosture } from "./pickUpPosture";
import { pickUpSearch } from "./pickUpSearch";

/*
 * The body a pick up acts from.
 * Parameter context: The pick up's context.
 * Parameter side: The reaching arm.
 * Parameter lift: The asked lift, metres.
 * Parameter authored: The grip as the archetype declares it.
 * Parameter carried: World displacement accumulated before lifting a moving prop,
 * metres.
 * Parameter closure: The prop's world frame at moving grasp closure, or omitted for
 * ordinary pickup.
 * Returns: The grasp, the stance and the raise.
 * When the entry neither stands nor sits and the grip is
 * beyond the arm, or the lowering refuses a body that does not stand.
 */
export function pickUpStance(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  side: AutoMovieHumanSide,
  lift: number,
  authored: IAutoMovieMotionHumanGrasp.ITarget,
  carried?: IAutoMovieVector3,
  closure?: IAutoMovieRigidTransform,
): pickUpStance.IChosen {
  const search: (stance: pickUpPosture.IStance) => pickUpSearch.ISearched = (
    stance: pickUpPosture.IStance,
  ): pickUpSearch.ISearched =>
    pickUpSearch(context, side, lift, authored, stance, carried, closure);
  const missed: (found: pickUpSearch.ISearched) => boolean = (
    found: pickUpSearch.ISearched,
  ): boolean =>
    !pickUpPosture.reaches(
      context,
      side,
      found.stance.posture,
    )(found.chosen.wrist);

  // The grasp chosen from the entry's body; where its arm does not reach,
  // from the body lowered toward the grip (`pickUpPosture`).
  let found: pickUpSearch.ISearched = search({
    posture: context.entry.posture,
    at: (): IAutoMovieMotionHumanPosture => context.entry.posture,
    lower: (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => posture,
  });
  // A standing body no stoop or squat brings to the grip may still turn
  // or step toward it, below: for it the lowering is one candidate of
  // several, tried as Algorithm 1 tries a base and left behind on a reach
  // refusal (`AutoMovieMotionHumanTouchStance.attempt`); anything else the
  // lowering refuses stands.
  const standing: boolean = context.entry.base.kind === "standing";
  const lower = (grip: IAutoMovieVector3): pickUpPosture.IStance =>
    pickUpPosture.lowered(context, side, grip);
  let lowered: pickUpPosture.IStance | null = !missed(found)
    ? null
    : standing
      ? (AutoMovieMotionHumanTouchStance.attempt(lower, authored.point) ?? null)
      : lower(authored.point);
  if (lowered !== null) found = search(lowered);

  // Still out of reach, the trunk turns toward the grip first.
  if (missed(found)) {
    lowered = pickUpAdjust.turned(
      context,
      side,
      found.chosen.wrist.point,
      found.stance,
    );
    found = search(lowered);
  }

  // Still out of reach, one foot takes one adjustment step toward it; and
  // where the lift is still out of reach of every freedom of the body,
  // the step is taken for the grasp and the lift together.
  const before: pickUpSearch.ISearched = found;
  const step: (
    lifted?: IAutoMovieVector3,
  ) => Omit<pickUpStance.IChosen, "raise"> | null = (
    lifted?: IAutoMovieVector3,
  ): Omit<pickUpStance.IChosen, "raise"> | null => {
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
          found: search(stepped),
        };
  };
  if (standing && missed(found)) {
    const taken: Omit<pickUpStance.IChosen, "raise"> | null = step();
    if (taken !== null) ({ found, lowered } = taken);
  }
  if (lift <= 0) return { found, lowered, raise: pickUpLift.ARM };
  /*
   * The lifted wrist goal after the load phase's travel.
   */
  const place = (searched: pickUpSearch.ISearched): IAutoMovieVector3 => {
    const { point } = searched.chosen.wrist;
    const raised: IAutoMovieVector3 = { ...point, y: point.y + lift };
    return carried === undefined ? raised : Vector3.add(raised, carried);
  };
  const raise: pickUpLift.IRaise | null = pickUpLift.raise(
    context,
    side,
    place(found),
    lift,
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
  let last: Omit<pickUpStance.IChosen, "raise"> | null = null;
  let source: pickUpSearch.ISearched = before;
  while (!tried.includes(`${source.chosen.turn}/${source.chosen.tilt}`)) {
    tried.push(`${source.chosen.turn}/${source.chosen.tilt}`);
    const whole: Omit<pickUpStance.IChosen, "raise"> | null = step(
      place(source),
    );
    if (whole === null) break;
    const carried: pickUpLift.IRaise | null = pickUpLift.raise(
      context,
      side,
      place(whole.found),
      lift,
      whole.lowered,
      whole.found.stance.posture,
    );
    if (carried !== null) return { ...whole, raise: carried };
    last = whole;
    source = whole.found;
  }
  return { ...(last ?? { found, lowered }), raise: pickUpLift.ARM };
}

/*
 * The body a pick up takes its grip and makes its lift from (`pickUp`).
 *
 * The grasp is chosen from the entry's body. Where the arm does not reach it,
 * the body is lowered toward the grip (`pickUpPosture`); still out of reach,
 * the trunk turns toward it, and a standing body takes one adjustment step
 * (`pickUpAdjust`). The lift is then carried by the arm, the trunk or the
 * stance's straightening (`pickUpLift.raise`). Where none of them carries it, a
 * standing body takes its one step for the whole task, the grasp and the lifted
 * place together, since a person who must lift a thing steps where the lift can
 * be made, not only the grasp.
 */
export namespace pickUpStance {
  /*
   * The body a pick up acts from.
   */
  export interface IChosen {
    /*
     * The grasp chosen from the stance.
     */
    found: pickUpSearch.ISearched;

    /*
     * The stance the body lowered, turned or stepped into; null where it
     * reached from the entry.
     */
    lowered: pickUpPosture.IStance | null;

    /*
     * How the body carries the lift; `pickUpLift.ARM` where the arm alone does,
     * or where nothing does and the plan's hand is left to the lift's
     * judgement.
     */
    raise: pickUpLift.IRaise;
  }
}
