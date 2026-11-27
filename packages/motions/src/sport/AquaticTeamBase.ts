import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
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

/**
 * The offered palm's depth below the surface at the apex, and how much deeper
 * it waits before it, over stature: provisional, submerged under the flyer's
 * foot.
 */
const DEPTH: number = 0.235;
const RISE: number = 0.04;

/**
 * The offered palm outside the shoulder, over the shoulder's half-width, and
 * the share of the arm's length it extends to: provisional, a pressing arm
 * short of straight.
 */
const OUTSIDE: number = 0.25;
const EXTENSION: number = 0.95;

/**
 * A supporting base's elbow out from, below and behind its offered palm, over
 * stature: provisional, a forearm's length behind it and nearly level, so the
 * forearm lies flat and the palm faces up by supination alone.
 */
const ELBOW_OUT: number = 0.08;
const ELBOW_DOWN: number = 0.03;
const ELBOW_BACK: number = 0.13;

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
 * An artistic base's support: its palm offered under a flyer's foot, and the
 * turn of a limb onto or off a supporting palm or sole.
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
   * @param apex The base's own figure key at the apex.
   * @returns A pose writer for the supporting part of the figure.
   */
  export function prepare(
    context: AquaticPosture.Context,
    water: number,
    peak: number,
    apex: IAutoMovieMotionHumanPosture,
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
    // The palm is offered ahead of the base's own shoulder at the figure's
    // apex, at the apex depth, a little outside it, and as far ahead as an
    // arm extended to `EXTENSION` of its length reaches there.
    const shoulders: ReturnType<ReturnType<typeof AquaticPosture.markers>> =
      AquaticPosture.markers(
        body,
        sides.map(
          (side: AutoMovieHumanSide): AutoMovieHumanoidBone =>
            `${side}UpperArm`,
        ),
      )(apex);
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const offer = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
      const shoulder: IAutoMovieVector3 = shoulders.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const out: number = OUTSIDE * body.measure.shoulderHalfWidth;
      const up: number = water - body.measure.stature * DEPTH - shoulder.y;
      const ahead: number = Math.sqrt(
        Math.max(0, (EXTENSION * arm) ** 2 - up ** 2 - out ** 2),
      );
      return Vector3.add(
        shoulder,
        HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
          { x: (side === "left" ? 1 : -1) * out, y: 0, z: ahead },
        ),
      );
    };
    const palms: readonly IPalmOffer[] = sides.map(
      (side: AutoMovieHumanSide): IPalmOffer => ({
        side,
        contact: HumanHand.offset(body, side, "palm").point,
        at: offer(side),
        rotation: HumanHand.rotation(side, {
          fingers,
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
      const near: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.max(0, 1 - Math.abs(seconds - peak) / 0.36),
      );
      const y: number =
        water - body.measure.stature * (DEPTH + RISE * (1 - near));
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

  /**
   * Turn a limb around the actual palm or sole point as it takes or leaves
   * support.
   */
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
