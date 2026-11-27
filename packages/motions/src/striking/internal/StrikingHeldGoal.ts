import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { StrikingRoll } from "./StrikingRoll";

/** The held tool's original rigid wrist goal and fixed hand-local task geometry. */
export namespace StrikingHeldGoal {
  /**
   * The arm goal that holds a tool at a hand frame, given the grip's offset in
   * the hand: the wrist the grip's offset back from the held point, the contact
   * the tool's tip drawn `back` along its axis from the grip, and for a prop
   * two planted limits, at the drawn point (or the tool's length) and at the
   * tip, within `StrikingRoll.MISS`.
   *
   * @param tool The held tool.
   * @param frame The held point and the hand's attitude.
   * @param back How far the contact is drawn back along the axis, metres.
   * @param bend The elbow's bend direction.
   * @param grip The grip's offset in the hand's frame, metres.
   * @returns The goal.
   */
  export function of(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
    bend: IAutoMovieVector3,
    grip: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    return read(tool, frame, back, bend, grip);
  }

  /** Read the original wrist goal without retaining a fixed producer. */
  export function goal(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
    bend: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    return read(
      tool,
      frame,
      back,
      bend,
      HumanHand.offset(context.body, tool.side, "grip").point,
    );
  }

  /** Prepare only the unchanged grip and hand-local kept/limited tool points. */
  export function prepare(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
  ): (
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    bend: IAutoMovieVector3,
  ) => IAutoMovieHumanLimbGoal {
    const grip: IAutoMovieVector3 = HumanHand.offset(
      context.body,
      tool.side,
      "grip",
    ).point;
    const fixed: IGeometry = {
      contact: Vector3.add(grip, offset(tool, back)),
      limits: tool.prop === undefined ? undefined : limits(tool, back, grip),
    };
    return (
      frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
      bend: IAutoMovieVector3,
    ): IAutoMovieHumanLimbGoal => read(tool, frame, back, bend, grip, fixed);
  }

  /** A kept tool point relative to its grip socket, in hand-local metres. */
  export function offset(
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
  ): IAutoMovieVector3 {
    return Vector3.subtract(tool.tip, Vector3.scale(tool.axis, back));
  }
}

/** Private fixed hand-local geometry; never a pose or fitted candidate. */
interface IGeometry {
  /** Kept-point contact relative to the wrist. */
  contact: IAutoMovieVector3;
  /** Original ordered bounded tool points, absent for a bare hand. */
  limits?: readonly IAutoMovieHumanEffectorPointLimit[];
}

/** The original goal builder; only immutable local geometry may be supplied. */
function read(
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  back: number,
  bend: IAutoMovieVector3,
  grip: IAutoMovieVector3,
  fixed?: IGeometry,
): IAutoMovieHumanLimbGoal {
  return {
    point: Vector3.subtract(
      frame.point,
      Quaternion.rotateVector(frame.rotation, grip),
    ),
    rotation: frame.rotation,
    bend,
    // The original goal leaves elbow choice to the physical least-strain fit.
    elbow: "strain",
    contact:
      fixed === undefined
        ? Vector3.add(grip, StrikingHeldGoal.offset(tool, back))
        : { ...fixed.contact },
    ...(tool.prop === undefined
      ? {}
      : {
          limits:
            fixed === undefined
              ? limits(tool, back, grip)
              : fixed.limits!.map(
                  (
                    limit: IAutoMovieHumanEffectorPointLimit,
                  ): IAutoMovieHumanEffectorPointLimit => ({
                    contact: { ...limit.contact },
                    bound: limit.bound,
                  }),
                ),
        }),
    ...(tool.prop === undefined ? {} : { planted: true }),
  };
}

/** The original two task limits in kept-point then working-tip order. */
function limits(
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  back: number,
  grip: IAutoMovieVector3,
): IAutoMovieHumanEffectorPointLimit[] {
  return [back > 0 ? back : tool.length, 0].map(
    (behind: number): IAutoMovieHumanEffectorPointLimit => ({
      contact: Vector3.add(grip, StrikingHeldGoal.offset(tool, behind)),
      bound: StrikingRoll.MISS,
    }),
  );
}
