import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanHand } from "../posture/HumanHand";
import { StrikingHeld } from "../striking/StrikingHeld";

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
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "body" | "prop" | "start"
    >,
    prop: string,
    side: AutoMovieHumanSide,
    shown: IAutoMovieMotionHumanHand.IWrist,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanActionLaw.IGrip {
    const held: IAutoMovieMotionHumanPropReader = context.prop(prop);
    const grasped: IAutoMovieMotionHumanHeld.IHeld =
      AutoMovieMotionHumanHeld.grasped(
        context.body,
        side,
        prop,
        held.frame(context.start),
        held.prop.affordances ?? [],
        shown,
      );
    return {
      prop,
      side,
      tool: (
        points: IAutoMovieMotionHumanStrikingHeld.IPoints,
      ): IAutoMovieMotionHumanStrikingHeld.ITool =>
        StrikingHeld.read(grasped, points),
      posture,
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
    const side: AutoMovieHumanSide = demand.tool.side;
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "grip",
    ).point;
    const wrist: IAutoMovieMotionHumanHand.IWrist = {
      point: Vector3.subtract(
        demand.frame.point,
        Quaternion.rotateVector(demand.frame.rotation, socket),
      ),
      rotation: demand.frame.rotation,
    };
    // The hanging arm's elbow, only the fallback of a fit that finds no
    // legal swivel: the goal leaves the elbow to the body.
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      demand.posture,
      side,
    );
    return {
      posture: demand.posture,
      wrist,
      bend,
      goal: StrikingHeld.goal(
        { body },
        demand.tool,
        demand.frame,
        demand.back,
        bend,
      ),
      reference: false,
      judge: (
        bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      ): number =>
        Math.max(
          demand.least ?? 0,
          StrikingHeld.strayed(
            demand.tool,
            {
              point: HumanHand.frame(body, bones, side, "grip").point,
              rotation: bones.get(`${side}Hand`)!.worldRotation,
            },
            demand.frame,
            demand.back,
          ),
        ),
      bound: demand.bound,
    };
  }
}
