import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLineWalk,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * Read a pole's grips.
 * Parameter context: The walk's context.
 * Parameter subject: The pole's scene id.
 * Parameter start: The hips' frame as the walk starts.
 * Returns: The contacts and the goals.
 * When the pole declares no left or right grip.
 */
export function lineWalkPole(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLineWalk.IParams>,
  subject: string,
  start: IAutoMovieMotionHumanFrame,
): lineWalkPole.IHeld {
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const placed: IAutoMovieRigidTransform = read.frame(context.start);
  const grips: Record<AutoMovieHumanSide, ILocal> = {
    left: local(read, placed, subject, "leftGrip", start),
    right: local(read, placed, subject, "rightGrip", start),
  };
  return {
    contacts: (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: side === "left" ? "leftHand" : "rightHand",
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject },
      }),
    ),
    limbs: (
      frame: IAutoMovieMotionHumanFrame,
    ): IAutoMovieMotionHumanPosture["limbs"] => {
      const goal: (side: AutoMovieHumanSide) => IAutoMovieHumanLimbGoal = (
        side: AutoMovieHumanSide,
      ): IAutoMovieHumanLimbGoal => {
        const point: IAutoMovieVector3 = HumanFrame.point(
          frame,
          grips[side].point,
        );
        return AutoMovieMotionHumanArm.goal(context.body, side, {
          surface: "grip",
          shape: "fist",
          point,
          // An overhand grip: the fingers ahead over the pole, the palm down.
          rotation: HumanHand.rotation(side, {
            fingers: HumanFrame.forward(frame.yaw),
            palm: { x: 0, y: -1, z: 0 },
          }),
          bend: Vector3.add(
            point,
            HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
              { x: side === "left" ? 0.3 : -0.3, y: -0.2, z: -0.2 },
            ),
          ),
        });
      };
      return { leftArm: goal("left"), rightArm: goal("right") };
    },
  };
}

/*
 * A balancing pole held across a line walker: each hand grips the pole at its
 * `leftGrip` and `rightGrip` affordance where the pole rests as the walk
 * starts, and keeps that grip in the frame that travels with the hips, so the
 * pole rides with the body and stays in both hands.
 */
export namespace lineWalkPole {
  /*
   * The held pole's contacts and the hands' goals in a hips frame.
   */
  export interface IHeld {
    /*
     * Both hands' grips on the pole, the whole walk.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /*
     * The arms' goals with the hips in a frame.
     * Parameter frame: The hips' floor frame at a second.
     * Returns: Both arms' limb goals.
     */
    limbs(
      frame: IAutoMovieMotionHumanFrame,
    ): IAutoMovieMotionHumanPosture["limbs"];
  }
}

/*
 * A grip's point in the hips' start frame.
 */
function local(
  read: IAutoMovieMotionHumanPropReader,
  placed: IAutoMovieRigidTransform,
  subject: string,
  id: string,
  start: IAutoMovieMotionHumanFrame,
): ILocal {
  const found: IAutoMovieAffordance | undefined = (
    read.prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === id);
  if (found === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "pole",
      value: subject,
      reason: `${subject} declares no ${id}`,
      fix: "hold a pole that declares a leftGrip and a rightGrip",
    });
  const world: IAutoMovieVector3 = Vector3.add(
    placed.position,
    Quaternion.rotateVector(placed.rotation, found.frame.translation),
  );
  return { point: HumanFrame.local(start, world) };
}

/*
 * A grip held in the hips' frame.
 */
interface ILocal {
  /*
   * The grip's point in the frame.
   */
  point: IAutoMovieVector3;
}
