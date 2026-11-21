import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/**
 * Read the support that survives a cut before choosing the next swing. Keep
 * the displayed bearing placement and lower each airborne foot's baseline to
 * the same floor. The first beat can then move from its actual cut placement
 * to a real touchdown. Ordinary steps and cuts with both feet down need no
 * correction.
 *
 * @param context The incoming step's body and displayed entry state.
 * @returns The inherited support and ground placements, in world metres, or undefined when no foot is airborne at a step's cut.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which cuts need support readback and where the floor comes from.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the entering support flags and rig sole geometry to carry the known bearing side or preserve an already unsupported seam.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional bearing side and one floor-relative baseline for each airborne foot.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the rig's own heel and ball, keeping the displayed ankle and rotation at the cut.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads at most two sole points per foot once when planning a cut.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each incoming owner reads the same fixed floor and initial placement through its own landing window.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result holds the bearing side, at most two foot placements and their initial vertical offsets. It holds no time observations.
 */
export function strikingStepSupport(
  context: IAutoMovieMotionHumanActionContext,
): strikingStepSupport.ISupport | undefined {
  const { body, entry } = context;
  if (entry.from?.name !== "step" || entry.from.share >= 1) return undefined;
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
    const foot: IAutoMovieMotionHumanFoot.IPlacement = entry.feet[side];
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
    ): number =>
      seconds >= touchdown
        ? 0
        : rise[side] * (1 - minimumJerk.share(seconds / touchdown)),
  };
}

/** The support a striking action inherits from an interrupted step. */
export namespace strikingStepSupport {
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
     * Height above the landing placement, metres, at local seconds before
     * the foot's touchdown second, and zero from touchdown on.
     */
    rise(side: AutoMovieHumanSide, seconds: number, touchdown: number): number;
  }
}
