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
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * A balancing pole held across a line walker (#3997): each hand grips the
 * pole at its `leftGrip` and `rightGrip` affordance where the pole rests as
 * the walk starts, and keeps that grip in the frame that travels with the
 * hips, so the pole rides with the body and stays in both hands.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grips and how they travel.
 * @evidence contracts/development/design.md#principled-representation Hand goals at the pole's own affordances, held in the hips' frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader returning the grips' contacts and limb goals.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The grip points are the prop's; none is typed in.
 */
export namespace lineWalkPole {
  /** The held pole's contacts and the hands' goals in a hips frame. */
  export interface IHeld {
    /** Both hands' grips on the pole, the whole walk. */
    contacts: IAutoMovieMotionHumanContactWindow[];

    /**
     * The arms' goals with the hips in a frame.
     *
     * @param frame The hips' floor frame at a second.
     * @returns Both arms' limb goals.
     */
    limbs(
      frame: IAutoMovieMotionHumanFrame,
    ): IAutoMovieMotionHumanPosture["limbs"];
  }

  /**
   * Read a pole's grips.
   *
   * @param context The walk's context.
   * @param subject The pole's scene id.
   * @param start The hips' frame as the walk starts.
   * @returns The contacts and the goals.
   * @throws {HumanRefusal} When the pole declares no left or right grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the output and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each grip's world point and rotation at the start, expressed in the hips' start frame and re-placed in the current one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, localise, place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing grip is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arm goal and frame readers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the two local grips.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLineWalk.IParams>,
    subject: string,
    start: IAutoMovieMotionHumanFrame,
  ): IHeld {
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
        const turn: number = frame.yaw - start.yaw;
        const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          turn,
        );
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
            rotation: Quaternion.multiply(spin, grips[side].rotation),
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

  /** A grip held in the hips' frame. */
  interface ILocal {
    /** The grip's point in the frame. */
    point: IAutoMovieVector3;

    /** The grip's world rotation at the start. */
    rotation: IAutoMovieQuaternion;
  }

  /** A grip's point in the hips' start frame. */
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
      throw new HumanRefusal({
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
    return {
      point: HumanFrame.local(start, world),
      rotation: Quaternion.multiply(placed.rotation, found.frame.rotation),
    };
  }
}
