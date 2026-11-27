import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";

/**
 * Read the support that survives a cut before choosing the next swing. Keep the
 * displayed bearing placement and lower each airborne foot's baseline to the
 * same floor. The first beat can then move from its actual cut placement to a
 * real touchdown. Ordinary steps and cuts with both feet down need no
 * correction.
 *
 * @param context The incoming step's body and displayed entry state.
 * @returns The inherited support and ground placements, in world metres, or
 *   undefined when neither a step nor a punch was cut with an airborne foot.
 */
export function strikingStepSupport(
  context: IAutoMovieMotionHumanActionContext,
): strikingStepSupport.ISupport | undefined {
  const { body, entry } = context;
  const from: IAutoMovieMotionHumanEntryState["from"] = entry.from;
  if (
    from === undefined ||
    (from.family !== "step" && from.family !== "punch") ||
    from.share >= 1
  )
    return undefined;
  const { left, right } = entry.feet;
  if (left.planted && right.planted) return undefined;
  const bearing: AutoMovieHumanSide | undefined = left.planted
    ? "left"
    : right.planted
      ? "right"
      : undefined;

  // The lower of the heel and ball is the sole's floor contact height.
  const soleHeight = (
    side: AutoMovieHumanSide,
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): number =>
    Math.min(
      HumanFoot.point(body, side, "heel", foot).y,
      HumanFoot.point(body, side, "ball", foot).y,
    );
  const floor: number =
    bearing === undefined ? 0 : soleHeight(bearing, entry.feet[bearing]);
  const landings: strikingStepSupport.ISupport["landings"] = {};
  for (const side of ["left", "right"] as const) {
    const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
    if (foot.planted) continue;
    landings[side] = {
      ankle: {
        ...foot.ankle,
        y: foot.ankle.y + floor - soleHeight(side, foot),
      },
      rotation: foot.rotation,
    };
  }
  const rise: Record<AutoMovieHumanSide, number> = {
    left: left.ankle.y - (landings.left?.ankle.y ?? left.ankle.y),
    right: right.ankle.y - (landings.right?.ankle.y ?? right.ankle.y),
  };
  return {
    bearing,
    landings,
    rise: (
      side: AutoMovieHumanSide,
      seconds: number,
      touchdown: number,
    ): number => strikingStepSupport.settle(rise[side], seconds, touchdown),
  };
}

/** The support a striking action inherits from an interrupted step. */
export namespace strikingStepSupport {
  /**
   * How far a landing foot still hangs above its landing: the step's rise,
   * lowered on a minimum-jerk share until the touchdown.
   *
   * @param rise The foot's height above its landing at the cut, metres.
   * @param seconds The seconds since the cut.
   * @param touchdown The touchdown's seconds.
   * @returns Metres.
   */
  export function settle(
    rise: number,
    seconds: number,
    touchdown: number,
  ): number {
    return seconds >= touchdown
      ? 0
      : rise * (1 - minimumJerk.share(seconds / touchdown));
  }

  /**
   * The ground contact and pending touchdowns inherited from an interrupted
   * step, in world metres on the incoming action's local clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bearing side, the floor-height landing placements and the rise's clock and units.
   * @evidence contracts/development/design.md#principled-representation An optional bearing side, a partial record of airborne feet's ground placements and a closed-form rise in metres over local seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by step, its transition, guard, punch footwork, kick launch and carriage, and defence geometry; each consumes the bearing side, landings or rise.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent landing means the foot bears at the cut, so no flag duplicates it.
   */
  export interface ISupport {
    /** The foot on the ground at the cut, if one bears. */
    bearing: AutoMovieHumanSide | undefined;

    /** The floor-height placement for each foot still airborne at the cut. */
    landings: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
    >;

    /**
     * Height above the landing placement, metres, at local seconds before the
     * foot's touchdown second, and zero from touchdown on.
     */
    rise(side: AutoMovieHumanSide, seconds: number, touchdown: number): number;
  }
}
