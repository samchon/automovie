import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * A rise onto the toes: both feet turn about their toes' joints, which stay
 * where they stand with the toes flat, so each heel and ankle rises and the
 * body with them. A law that needs height it cannot lean for (a kiss on a
 * forehead, a reach for a shelf) raises its root by `lift` and adds `legs`.
 *
 * The heel's angle is the foot's pitch about the joint, degrees; the ankle
 * rises by the joint-to-ankle lever's turn, about 5 cm at 35 degrees on an
 * average foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, what stays on the floor, who uses it and the angle's meaning with a magnitude.
 * @evidence contracts/development/design.md#principled-representation A foot placement pivoted about a sole point, the representation the lunge's trailing foot uses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance type, the raised foot, the root's lift and the legs' primitives; read by the kiss.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No height is stated: it follows from the foot's own lever.
 */
export namespace AutoMovieMotionHumanRise {
  /** Both feet as they stand flat. */
  export type Stance = Record<"left" | "right", HumanFoot.IPlacement>;

  /**
   * A foot with its heel raised about its toes' joint.
   *
   * @param body The body.
   * @param side The foot.
   * @param flat The foot as it stands flat.
   * @param degrees The heel's raise, degrees.
   * @returns The raised foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the pivot.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid turn of the foot about the metatarsophalangeal joint held at its flat place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The joint's place is read off the flat foot, not assumed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFoot.pivot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function foot(
    body: IHumanBody,
    side: "left" | "right",
    flat: HumanFoot.IPlacement,
    degrees: number,
  ): HumanFoot.IPlacement {
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
   * How far the root moves with the ankles of a rise: the mean of both
   * ankles' travel.
   *
   * @param body The body.
   * @param stance Both feet as they stand flat.
   * @param degrees The heels' raise, degrees.
   * @returns The travel, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the travel is the mean of and its frame.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis rides the two ankles, so it takes their mean travel and the legs keep their lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two raised feet and one mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both feet are read, so feet of unequal headings are carried.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `foot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lift(
    body: IHumanBody,
    stance: Stance,
    degrees: number,
  ): IAutoMovieVector3 {
    const travel = (side: "left" | "right"): IAutoMovieVector3 =>
      Vector3.subtract(
        foot(body, side, stance[side], degrees).ankle,
        stance[side].ankle,
      );
    return Vector3.scale(Vector3.add(travel("left"), travel("right")), 0.5);
  }

  /**
   * The legs of a rise: each foot's goal on its raised placement, planted,
   * with the toes bent back flat on the floor.
   *
   * @param props The body, the flat stance, the window in seconds since the action's start and the heels' raise in degrees at a second.
   * @returns One primitive per leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each leg is given and the argument's units.
   * @evidence contracts/development/implementation.md#principled-implementation The foot's rigid pivot with the toes' joint extended by the same angle, which leaves the toes on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write per leg: the toes' joint and the leg's goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is solved on the posture written so far, so a raised or leaned root is followed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `foot` and `AutoMovieMotionHumanLeg.goal`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props.
   */
  export function legs(props: {
    body: IHumanBody;
    stance: Stance;
    from: number;
    to: number;
    degrees: (seconds: number) => number;
  }): IAutoMovieMotionHumanPrimitive[] {
    return (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieMotionHumanPrimitive => ({
        channels: [`${side}Leg`],
        from: props.from,
        to: props.to,
        write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
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
