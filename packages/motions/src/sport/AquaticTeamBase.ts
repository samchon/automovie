import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { AquaticPosture } from "./AquaticPosture";

/** A supporting base's elbow out from, below and behind its offered palm, over stature: provisional, a pressing arm. */
const ELBOW_OUT: number = 0.12;
const ELBOW_DOWN: number = 0.12;
const ELBOW_BACK: number = 0.06;

/** Fixed plan-time placement and pose offer of one supporting hand. */
interface IPalmOffer {
  /** The supporting hand's anatomical side. */
  side: AutoMovieHumanSide;

  /** Its bearing palm offset in hand coordinates, metres. */
  contact: IAutoMovieVector3;

  /** Its horizontal set position on the beat, world metres. */
  at: IAutoMovieVector3;

  /** Its bearing orientation, with the palm facing up. */
  rotation: IAutoMovieQuaternion;
}

/**
 * An artistic base's support: its palm offered under a flyer's foot, and
 * the turn of a limb onto or off a supporting palm or sole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is offered, where, and how a limb takes or leaves support.
 * @evidence contracts/development/design.md#principled-representation A world palm point and orientation set from the base's own frame, with its own elbow hint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by the base and the flyer of \AquaticTeam\.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flyer reads the base's displayed palm; this only writes the base's goal.
 */
export namespace AquaticTeamBase {
  /** The shared upward direction of the figure's hand and sole frames. */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /**
   * Prepare the base swimmer's independent palm offer.
   *
   * @param context The base performer and selected supporting side.
   * @param water The common world water surface, metres.
   * @param peak The timed figure apex, in action seconds.
   * @returns A pose writer for the supporting part of the figure.
   */
  export function prepare(
    context: AquaticPosture.Context,
    water: number,
    peak: number,
  ): (
    shaped: IAutoMovieMotionHumanPosture,
    seconds: number,
    weight: number,
  ) => IAutoMovieMotionHumanPosture {
    const { body, entry, params }: AquaticPosture.Context = context;
    const sides: readonly AutoMovieHumanSide[] =
      params.side === undefined ? ["left", "right"] : [params.side];
    const markers: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(
        body,
        sides.flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
          `${side}Hand`,
          `${side}LowerArm`,
        ]),
      );
    const frame: IAutoMovieMotionHumanFrame = {
      origin: entry.posture.root,
      yaw: entry.posture.yaw,
    };
    const fingers: IAutoMovieVector3 = HumanFrame.forward(frame.yaw);
    const palms: readonly IPalmOffer[] = sides.map(
      (side: AutoMovieHumanSide): IPalmOffer => ({
        side,
        contact: HumanHand.offset(body, side, "palm").point,
        at: HumanFrame.point(frame, {
          x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth * 1.25,
          y: 0,
          z: body.measure.forearm * 0.95,
        }),
        // A supinated hand under a load points its fingers inward and
        // forward, as a tray is carried, not straight ahead.
        rotation: HumanHand.rotation(side, {
          fingers: Vector3.normalize(
            Vector3.add(
              fingers,
              HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
                { x: side === "left" ? -1 : 1, y: 0, z: 0 },
              ),
            ),
          ),
          palm: UP,
        }),
      }),
    );
    return (
      shaped: IAutoMovieMotionHumanPosture,
      seconds: number,
      weight: number,
    ): IAutoMovieMotionHumanPosture => {
      const bones: ReturnType<typeof markers> = markers(shaped);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...shaped.limbs };

      // The base's palm rises slightly but stays submerged at the figure apex.
      const near: number = minimumJerk.share(
        Math.max(0, 1 - Math.abs(seconds - peak) / 0.36),
      );
      const y: number = water - body.measure.stature * (0.275 - 0.04 * near);
      for (const { side, contact, at, rotation } of palms) {
        // The elbow bends out, down and back of the offered palm, not toward
        // wherever the figure key holds the sculling arm.
        const palm: IAutoMovieVector3 = { x: at.x, y, z: at.z };
        limbs[`${side}Arm`] = {
          ...transfer(
            bones.get(`${side}Hand`)!,
            bones.get(`${side}LowerArm`)!.worldPosition,
            contact,
            palm,
            rotation,
            weight,
          ),
          bend: Vector3.add(
            palm,
            HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
              {
                x:
                  (side === "left" ? 1 : -1) * ELBOW_OUT * body.measure.stature,
                y: -ELBOW_DOWN * body.measure.stature,
                z: -ELBOW_BACK * body.measure.stature,
              },
            ),
          ),
        };
      }
      return { ...shaped, limbs };
    };
  }

  /** Turn a limb around the actual palm or sole point as it takes or leaves support. */
  export function transfer(
    end: IAutoMovieResolvedBone,
    bend: IAutoMovieVector3,
    contact: IAutoMovieVector3,
    target: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
    weight: number,
  ): IAutoMovieHumanLimbGoal {
    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
      end.worldRotation,
      facing,
      weight,
    );
    const original: IAutoMovieVector3 = Vector3.add(
      end.worldPosition,
      Quaternion.rotateVector(end.worldRotation, contact),
    );
    return {
      point: Vector3.subtract(
        Vector3.lerp(original, target, weight),
        Quaternion.rotateVector(rotation, contact),
      ),
      bend,
      rotation,
      contact,
    };
  }
}
