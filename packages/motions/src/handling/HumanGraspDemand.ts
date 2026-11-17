import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";
import type { HumanGrasp } from "./HumanGrasp";
import { HumanGraspJudgement } from "./HumanGraspJudgement";

/**
 * A grip judged by what the performer's next action on the prop will do
 * with it (`IHumanActionContext.demands`): the grip a candidate grasp would
 * take, as that action reads it, and each pose the action demands as a key
 * the grasp must also hold (`HumanGrasp.reachable`), judged as the action
 * judges the pose. The goal posture is planned first and the grasp chosen
 * for it (Rosenbaum, Meulenbroek, Vaughan and Jansen 2001, posture-based
 * motion planning; the end-state comfort effect follows from it): the next
 * action's goal pose is a constraint on the grasp, as task-oriented grasp
 * and pick-and-place planners take it, and a transition between two modes
 * of contact must be feasible in both (Hauser and Ng-Thow-Hing 2011).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is judged, by whom and the sources of the order.
 * @evidence contracts/development/design.md#principled-representation The candidate grip as the asked action reads a held prop, and a demand as one more key of the grasp's choice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The grip and the key, read by `pickUpSearch`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action is named: the demands are the next action's own.
 */
export namespace HumanGraspDemand {
  /**
   * The grip a candidate grasp would take on a prop, as an action asked
   * for its demands reads it: the prop rigid in the hand the arm shows for
   * the candidate, read as a held tool (`StrikingHeld.read`), with the
   * posture the grasping action leaves the body in.
   *
   * @param context The grasping action's context.
   * @param prop The prop.
   * @param side The hand.
   * @param shown The hand the arm shows for the candidate grasp.
   * @param posture The posture the grasping action leaves the body in with that grasp.
   * @returns The grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the grip and how it is read.
   * @evidence contracts/development/implementation.md#principled-implementation The fingers close on the prop where the hand is shown, so the prop's place in the hand is read from the shown hand, as a held prop's is (`AutoMovieMotionHumanHeld.grasped`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One grasp record, read per asked working point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The grasp record once per candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The held owner's grasp and the held tool's reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The grip closes over the grasp record.
   */
  export function grip(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "prop" | "start">,
    prop: string,
    side: AutoMovieHumanSide,
    shown: IAutoMovieMotionHumanHand.IWrist,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanActionLaw.IGrip {
    return prepare(context, prop, side, posture)(shown);
  }

  /**
   * Read the prop once before building candidate grips for the same search.
   *
   * @param context The body, prop reader and action start fixed by the search.
   * @param prop The prop each candidate grasps.
   * @param side The grasping hand.
   * @param posture The posture the action leaves after grasping.
   * @returns A builder that reads only the candidate's displayed wrist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, the variable displayed wrist and the returned builder.
   * @evidence contracts/development/implementation.md#principled-implementation Each candidate's held offset is still computed from its own displayed wrist; only the identical prop frame at the action's start and affordance list are prepared once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prop reading precedes a wrist-specific held record and the existing tool reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate tool transform or demanded goal is reused across differing wrists.
   * @evidence contracts/development/implementation.md#efficient-algorithms The prop and start frame are read once for C candidate grips; each candidate retains constant transform work and its demanded contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body, prop at the fixed action start, side and ending posture belong to one grasp search; a new search acquires a new builder.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns the builder's one prop frame and affordance list and releases them with its closure; candidate records retain only their own held transform.
   */
  export function prepare(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "prop" | "start">,
    prop: string,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
  ): (shown: IAutoMovieMotionHumanHand.IWrist) => IAutoMovieMotionHumanActionLaw.IGrip {
    const held: IAutoMovieMotionHumanPropReader = context.prop(prop);
    const frame: IAutoMovieRigidTransform = held.frame(context.start);
    return (shown: IAutoMovieMotionHumanHand.IWrist): IAutoMovieMotionHumanActionLaw.IGrip => {
      const grasped: IAutoMovieMotionHumanHeld.IHeld =
        AutoMovieMotionHumanHeld.grasped(
          context.body, side, prop, frame, held.prop.affordances ?? [], shown,
        );
      return {
        prop,
        side,
        tool: (points: IAutoMovieMotionHumanStrikingHeld.IPoints): IAutoMovieMotionHumanStrikingHeld.ITool =>
          StrikingHeld.read(grasped, points),
        posture,
      };
    };
  }

  /**
   * A demanded pose as a key of the grasp's choice, fitted and judged as the
   * demanding action fits and judges its pose (`StrikingRoll.miss`): its own
   * goal for the held tool (`StrikingHeld.goal`), the elbow at the place of
   * least joint strain the fit itself finds, on its own arm solution rather
   * than the grasp's, on the demanded posture with the other limbs it shows
   * (a support hand, which the posture resolver couples with the arm);
   * judged by how far the tool strays from the frame
   * (`StrikingHeld.strayed`), never below a stray the demand proved before
   * any search, within the action's own bound.
   *
   * @param body The body.
   * @param demand The demanded pose.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key, its elbow, its posture, its measure and its bound.
   * @evidence contracts/development/implementation.md#principled-implementation The key passes exactly when the demanding action would not refuse the pose: the same goal, elbow and arm solution its refusal fits (`StrikingRoll.miss`), the posture's other limbs kept so the coupled fit the pose is shown by is the one judged, the same stray against the same bound; a key fitted on the grasp's solution failed grips that action accepts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrist, the goal, the judge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The measure and the bound are both metres.
   * @evidence contracts/development/implementation.md#efficient-algorithms The elbow is the fit's own; the judge reads the fitted bones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The held tool's goal and measure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The judge closes over the demand.
   */
  export function key(
    body: IAutoMovieMotionHumanBody,
    demand: IAutoMovieMotionHumanActionLaw.IDemand,
  ): IAutoMovieMotionHumanGrasp.IKey {
    return prepareKey(body, demand.posture)(demand);
  }

  /**
   * Prepare one unchanged body/posture for actual demanded tool frames.
   * Each hand's original grip socket and hanging fallback elbow are read
   * on first use. Consecutive queries may share one tool's immutable local
   * geometry and kept point; actual world frames and bounds remain inputs,
   * and each key still carries the complete posture/goals.
   *
   * @param body The fixed canonical body and immutable rig/surface geometry.
   * @param posture The fixed actual posture, including other-limb/digit goals.
   * @returns The original key for each actual demand on this posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/posture lifetime, lazily admitted per-hand geometry, actual demand fields and complete key/actual-metre judge output.
   * @evidence contracts/development/implementation.md#principled-implementation A hand's grip offset and hanging fallback depend only on the unchanged body/posture; each actual frame still builds its original rigid wrist, complete StrikingHeld goal and two-point strayed judge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy canonical hand-geometry owner precedes the original wrist/goal/judge adapter; key creates a fresh builder for each actual demand, without carrying direct posture assembly across roll callbacks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The demanded tool, kept point, bound, proven least stray, reference=false policy and all coupled posture constraints remain unchanged; no key or fit answer is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each cold key prepares its original grip/hanging rigid hint and goal offsets once, then its actual judge uses only the required grip point rather than unused normal/forward outputs. The builder supports bounded hand/tool prerequisites only under its explicit unchanged-source contract; current raw use rolls create independent keys and all original fits remain. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical body geometry owns the local grip reading. The explicit factory requires unchanged source posture, while key acquires current posture anew for every call; no raw graph is inferred immutable from identity, a private callback or an unchanged tool reference.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The grasp search owns at most two hand records and one last-tool producer, replaced on a tool/back change and released with the builder. The shared judgement owner prevents returned keys from retaining either search preparation context; each judge retains only its fixed grip-point reader and actual demand, with no FK reader, time history or handle.
   */
  export function prepareKey(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): (demand: Omit<IAutoMovieMotionHumanActionLaw.IDemand, "posture">) => IAutoMovieMotionHumanGrasp.IKey {
    const hands: Map<AutoMovieHumanSide, IHand> = new Map();
    const goals: IGoalContext = {};
    return (demand: Omit<IAutoMovieMotionHumanActionLaw.IDemand, "posture">): IAutoMovieMotionHumanGrasp.IKey => {
      const side: AutoMovieHumanSide = demand.tool.side;
      let hand: IHand | undefined = hands.get(side);
      if (hand === undefined) {
        hand = {
          socket: HumanHand.offset(body, side, "grip").point,
          judge: HumanGraspJudgement.tool(body, side),
        };
        hands.set(side, hand);
      }
      return demandedKey(body, posture, demand, hand, goals);
    };
  }
}

/** Assemble a key outside the preparation closure so its judge cannot retain the hand map. */
function demandedKey(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  demand: Omit<IAutoMovieMotionHumanActionLaw.IDemand, "posture">,
  hand: IHand,
  goals: IGoalContext,
): IAutoMovieMotionHumanGrasp.IKey {
  const side: AutoMovieHumanSide = demand.tool.side;
  const wrist: IAutoMovieMotionHumanHand.IWrist = {
    point: Vector3.subtract(
      demand.frame.point,
      Quaternion.rotateVector(demand.frame.rotation, hand.socket),
    ),
    rotation: demand.frame.rotation,
  };

  // The hanging arm's elbow, only the fallback of a fit that finds no
  // legal swivel: the goal leaves the elbow to the body.
  hand.bend ??= AutoMovieMotionHumanBend.hang(body, posture, side);
  const bend: IAutoMovieVector3 = { ...hand.bend };
  if (goals.tool !== demand.tool || !Object.is(goals.back, demand.back)) {
    goals.tool = demand.tool;
    goals.back = demand.back;
    goals.read = StrikingHeld.prepareGoal({ body }, demand.tool, demand.back);
  }
  return {
    posture,
    wrist,
    bend,
    goal: goals.read!(demand.frame, bend),
    reference: false,
    judge: hand.judge(demand),
    bound: demand.bound,
  };
}

/** Fixed actual geometry of one hand on the prepared body/posture. */
interface IHand {
  /** Grip-socket offset from the wrist in hand axes, metres. */
  socket: IAutoMovieVector3;
  /** Issued actual tool judges share fixed grip-point geometry without capturing this hand record. */
  judge: ReturnType<typeof HumanGraspJudgement.tool>;
  /** World-metre hanging elbow fallback, read lazily after the first actual wrist transform. */
  bend?: IAutoMovieVector3;
}

/** One bounded consecutive immutable tool/back geometry, never a goal or fit result. */
interface IGoalContext {
  /** The exact unchanged source of the prepared local tool offsets. */
  tool?: IAutoMovieMotionHumanStrikingHeld.ITool;
  /** Its kept-point distance in metres, compared without merging signed zero. */
  back?: number;
  /** The fixed-geometry owner; replaced as soon as tool or back changes. */
  read?: ReturnType<typeof StrikingHeld.prepareGoal>;
}
