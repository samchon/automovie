import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";

/**
 * A rise onto the toes: both feet turn about their toes' joints, which stay
 * where they stand with the toes flat, so each heel and ankle rises and the
 * body with them. A law that needs height it cannot lean for (a kiss on a
 * forehead, a reach for a shelf) raises its root by `lift` and adds `legs`.
 *
 * The heel's angle is the foot's pitch about the joint, degrees; the ankle
 * rises by the joint-to-ankle lever's turn, about 7 cm at 35 degrees on an
 * average foot (74 mm measured on the average polygon man, whose ankle stands
 * 129 mm behind the toes' joint).
 */
export namespace AutoMovieMotionHumanRise {
  /**
   * A foot with its heel raised about its toes' joint.
   *
   * @param body The body.
   * @param side The foot.
   * @param flat The foot as it stands flat.
   * @param degrees The heel's raise, degrees.
   * @returns The raised foot's placement.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    flat: IAutoMovieMotionHumanFoot.IPlacement,
    degrees: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return HumanFoot.pivot(
      body,
      side,
      "mtp",
      HumanFoot.point(body, side, "mtp", flat),
      HumanFoot.heading(flat.rotation),
      -degrees,
    );
  }

  /**
   * How far the root moves with the ankles of a rise: the mean of both ankles'
   * travel.
   *
   * @param body The body.
   * @param stance Both feet as they stand flat.
   * @param degrees The heels' raise, degrees.
   * @returns The travel, world metres.
   */
  export function lift(
    body: IAutoMovieMotionHumanBody,
    stance: IAutoMovieMotionHumanRise.Stance,
    degrees: number,
  ): IAutoMovieVector3 {
    const travel = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
      Vector3.subtract(
        foot(body, side, stance[side], degrees).ankle,
        stance[side].ankle,
      );
    return Vector3.scale(Vector3.add(travel("left"), travel("right")), 0.5);
  }

  /**
   * The legs of a rise: each foot's goal on its raised placement, planted, with
   * the toes bent back flat on the floor.
   *
   * @param props The body, the flat stance, the window in seconds since the
   *   action's start and the heels' raise in degrees at a second.
   * @returns One primitive per leg.
   */
  export function legs(
    props: IAutoMovieMotionHumanRise.ILegsProps,
  ): IAutoMovieMotionHumanPrimitive[] {
    return (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => ({
        channels: [`${side}Leg`],
        reads: ["root", `${side}Leg`],
        from: props.from,
        to: props.to,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          const degrees: number = props.degrees(seconds);
          return {
            ...posture,
            joints: { ...posture.joints, [`${side}Toes`]: [degrees, 0, 0] },
            limbs: {
              ...posture.limbs,
              [`${side}Leg`]: AutoMovieMotionHumanLeg.goal(
                props.body,
                posture,
                side,
                foot(props.body, side, props.stance[side], degrees),
                true,
              ),
            },
          };
        },
      }),
    );
  }
}
