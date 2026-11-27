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
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";

/**
 * A grip judged by what the performer's next action on the prop will do with it
 * (`IHumanActionContext.demands`): the grip a candidate grasp would take, as
 * that action reads it, and each pose the action demands as a key the grasp
 * must also hold (`HumanGrasp.reachable`), judged as the action judges the
 * pose. The goal posture is planned first and the grasp chosen for it
 * (Rosenbaum, Meulenbroek, Vaughan and Jansen 2001, posture-based motion
 * planning; the end-state comfort effect follows from it): the next action's
 * goal pose is a constraint on the grasp, as task-oriented grasp and
 * pick-and-place planners take it, and a transition between two modes of
 * contact must be feasible in both (Hauser and Ng-Thow-Hing 2011).
 */
export namespace HumanGraspDemand {
  /**
   * The grip a candidate grasp would take on a prop, as an action asked for its
   * demands reads it: the prop rigid in the hand the arm shows for the
   * candidate, read as a held tool (`StrikingHeld.read`), with the posture the
   * grasping action leaves the body in.
   *
   * @param context The grasping action's context.
   * @param prop The prop.
   * @param side The hand.
   * @param shown The hand the arm shows for the candidate grasp.
   * @param posture The posture the grasping action leaves the body in with that
   *   grasp.
   * @param closure The prop's world frame at closure, or the entry frame when
   *   omitted.
   * @returns The grip.
   */
  export function grip(
    context: Pick<IAutoMovieMotionHumanActionContext, GripContext>,
    prop: string,
    side: AutoMovieHumanSide,
    shown: IAutoMovieMotionHumanHand.IWrist,
    posture: IAutoMovieMotionHumanPosture,
    closure?: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanActionLaw.IGrip {
    const held: IAutoMovieMotionHumanPropReader = context.prop(prop);
    const grasped: IAutoMovieMotionHumanHeld.IHeld =
      AutoMovieMotionHumanHeld.grasped(
        context.body,
        side,
        prop,
        closure ?? held.frame(context.start),
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
   * than the grasp's, on the demanded posture with the other limbs it shows (a
   * support hand, which the posture resolver couples with the arm); judged by
   * how far the tool strays from the frame (`StrikingHeld.strayed`), never
   * below a stray the demand proved before any search, within the action's own
   * bound.
   *
   * @param body The body.
   * @param demand The demanded pose.
   * @returns The key.
   */
  export function key(
    body: IAutoMovieMotionHumanBody,
    demand: IAutoMovieMotionHumanActionLaw.IDemand,
  ): IAutoMovieMotionHumanGrasp.IKey {
    const side: AutoMovieHumanSide = demand.tool.side;
    const hand: AutoMovieHumanoidBone = `${side}Hand`;
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "grip",
    ).point;
    const point: ReturnType<typeof HumanHand.preparePoint> =
      HumanHand.preparePoint(body, side, "grip");
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
              point: point(bones),
              rotation: bones.get(hand)!.worldRotation,
            },
            demand.frame,
            demand.back,
          ),
        ),
      bound: demand.bound,
    };
  }
}

/** The alternatives of `GripContext`'s site. */
type GripContext = "body" | "prop" | "start";
