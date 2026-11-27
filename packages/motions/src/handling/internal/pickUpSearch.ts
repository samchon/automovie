import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspDemand } from "./HumanGraspDemand";
import { HumanGraspSearch } from "./HumanGraspSearch";
import { HumanGraspUse } from "./HumanGraspUse";
import { pickUpPosture } from "./pickUpPosture";

/** The digit tips a grip keeps above the floor. */
const TIPS: readonly IAutoMovieMotionHumanHand.DigitSurface[] = [
  "thumbTip",
  "indexTip",
  "middleTip",
  "ringTip",
  "littleTip",
];

/**
 * The grasp the arm reaches best from a stance's posture, the lifted pose and
 * any use's pose its keys (`HumanGrasp.reachable`).
 *
 * @param context The pick up's context.
 * @param side The reaching hand.
 * @param lift How far the prop is lifted, metres.
 * @param authored The grip as the prop declares it.
 * @param stance The body the arm reaches from.
 * @param carried World displacement accumulated before lifting a moving prop,
 *   metres.
 * @param closure The prop's world frame at moving grasp closure, or omitted for
 *   ordinary pickup.
 * @returns The chosen grasp, the elbow hint and the stance.
 */
export function pickUpSearch(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPickUp.IParams>,
  side: AutoMovieHumanSide,
  lift: number,
  authored: IAutoMovieMotionHumanGrasp.ITarget,
  stance: pickUpPosture.IStance,
  carried?: IAutoMovieVector3,
  closure?: IAutoMovieRigidTransform,
): pickUpSearch.ISearched {
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
  const goal: (
    turn: number,
    tilt: number,
  ) => IAutoMovieMotionHumanHand.IWrist = (
    turn: number,
    tilt: number,
  ): IAutoMovieMotionHumanHand.IWrist =>
    HumanGrasp.hand(body, side, HumanGrasp.around(authored, turn), tilt);
  const declared: readonly number[] =
    pickUpSearch.TURNS[
      context
        .prop(context.params.prop)
        .prop.affordances?.find(
          (a: IAutoMovieAffordance): boolean => a.id === context.params.handle,
        )?.symmetry ?? "none"
    ];

  // The keys a grip must hold besides the grasp: the lifted pose, any
  // use's pose, and every pose the performer's next action on the prop
  // demands of it (`HumanGraspDemand`), asked from the body the pick up
  // ends in, its stance straightened back up.
  const demands: IAutoMovieMotionHumanActionContext["demands"] =
    context.demands;
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
                Math.max(
                  worst,
                  j / (bounds[i] === Infinity ? StrikingRoll.MISS : bounds[i]!),
                ),
              0,
            ),
        };

  // The keys of a candidate, built only as the search reaches them: the
  // lifted pose, any use's pose, then the next action's demands, whose
  // grip is read for this candidate alone.
  const stroke: (
    wrist: IAutoMovieMotionHumanHand.IWrist,
    shown: IAutoMovieMotionHumanHand.IWrist,
  ) => Generator<IAutoMovieMotionHumanGrasp.IKey> = function* (
    wrist: IAutoMovieMotionHumanHand.IWrist,
    shown: IAutoMovieMotionHumanHand.IWrist,
  ): Generator<IAutoMovieMotionHumanGrasp.IKey> {
    if (lift > 0)
      yield {
        posture: held,

        // Lifted, the complete position/rotation goal asks the hand to
        // keep the rotation it shows at the grasp, as the plan does.
        wrist: {
          point: {
            x: wrist.point.x + (carried?.x ?? 0),
            y: wrist.point.y + lift,
            z: wrist.point.z + (carried?.z ?? 0),
          },
          rotation: shown.rotation,
        },
        bend,
      };
    if (context.params.use !== undefined)
      yield HumanGraspUse.presented(
        {
          context,
          prop: context.params.prop,
          handle: context.params.handle,
          side,
          // The tool is rigid in the hand the arm shows at the grasp.
          wrist: shown,
          use: context.params.use,
        },
        closure,
      );
    if (demands !== undefined)
      for (const demand of demands(
        HumanGraspDemand.grip(
          context,
          context.params.prop,
          side,
          shown,
          after,
          closure,
        ),
      ))
        yield HumanGraspDemand.key(body, demand);
  };

  // A grasp whose wrist lies beyond the straight arm is tried only when
  // every one does: the choice and the refusal below read the same reach,
  // so a grip a millimetre beyond it is never chosen over one within it for
  // a cheaper fit. Each turn and tilt is judged on its own; a turn kept
  // only while all its tilts were within reach fell back to every turn when
  // none kept all seven, and a glass across the body was refused a grip
  // 9 mm beyond the arm while others lay within it.
  const reachable: ReturnType<typeof HumanGraspSearch> = HumanGraspSearch(
    body,
    held,
    side,
    bend,
    true,
  );
  const reaches: ReturnType<typeof pickUpPosture.reaches> =
    pickUpPosture.reaches(context, side, held);
  // A grip whose fingertips, open as the hand arrives, would pass under the
  // floor the feet stand on is no grip of a prop resting there: a grasp
  // planner rejects the grasps that collide with the object's support
  // (Miller and Allen 2004, IEEE Robot Autom Mag 11(4):110). A
  // ball on the floor is taken from above or the side, never under it.
  const floors: readonly number[] = context.entry.supports
    .filter(
      (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        (s.part === "leftFoot" || s.part === "rightFoot") &&
        s.support.kind === "ground",
    )
    .map((s: IAutoMovieMotionHumanEntryState.ISupport): number =>
      s.support.kind === "ground" ? (s.support.height ?? 0) : 0,
    );
  const tips: readonly IAutoMovieVector3[] = TIPS.map(
    (surface: IAutoMovieMotionHumanHand.DigitSurface): IAutoMovieVector3 =>
      HumanHand.offset(body, side, surface).point,
  );
  const floor: number | undefined =
    floors.length === 0 ? undefined : Math.min(...floors);
  const admits: ReturnType<typeof pickUpPosture.reaches> = (
    wrist: IAutoMovieMotionHumanHand.IWrist,
  ): boolean =>
    reaches(wrist) &&
    (floor === undefined ||
      tips.every(
        (tip: IAutoMovieVector3): boolean =>
          wrist.point.y + Quaternion.rotateVector(wrist.rotation, tip).y >=
          floor,
      ));
  const search: (
    tilts: readonly number[],
    turns: readonly number[],
  ) => IAutoMovieMotionHumanGrasp.IReach = (
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
          const first: IAutoMovieMotionHumanGrasp.IReach = search(
            [0],
            declared,
          );
          return required === undefined ||
            required.measure(first.keys, first.judged, first.bounds) <=
              required.bound
            ? first
            : search(HumanGraspUse.OBLIQUE, HumanGraspUse.AROUND);
        })();
  return { chosen, bend, stance };
}

/**
 * The grasp a pick up chooses from a stance (`pickUp`): the grip's turn and
 * tilt the arm reaches best, judged by the fit over the grasp, the lifted pose
 * and any use's pose. Without a use, the grip is taken as the archetype
 * declares it: untilted, and turned only within its declared symmetry
 * (`TURNS`).
 */
export namespace pickUpSearch {
  /**
   * The turns about the wrapped axis a grip is taken at without a use, degrees,
   * by its declared symmetry: any side of a round grip, in steps of 15, the two
   * sides of a half-symmetric one, and only the declared side of the rest.
   */
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

  /** A grasp chosen from its actual stance and hanging elbow hint. */
  export interface ISearched {
    /** The grasp the arm reaches best. */
    chosen: IAutoMovieMotionHumanGrasp.IReach;

    /** The elbow hint the arm hangs by, world metres. */
    bend: IAutoMovieVector3;

    /** The body the arm reaches from. */
    stance: pickUpPosture.IStance;
  }
}
