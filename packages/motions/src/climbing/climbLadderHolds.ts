import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLadder,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import type { HumanLadder } from "./HumanLadder";

/**
 * The holds of a rung-ladder climb: each foot's placement on every rung it
 * stands on with its swing arc between them, each hand's grip point on every
 * rung it holds with its path between them, and the legs' placements.
 * `climbLadder` owns the beats and the clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared, its frames and its owner.
 * @evidence contracts/development/design.md#principled-representation Per-side placements and world points, indexed by rung from the floor (0).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The holds record and the one builder climbLadder.plan calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every hold is a point of the ladder's own rungs.
 */
export namespace climbLadderHolds {
  /**
   * The prepared holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its index and frame.
   * @evidence contracts/development/design.md#principled-representation World placements and points by rung, and the arcs and paths between consecutive ones.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The five members climbLadder.plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only after preparation.
   */
  export interface IHolds {
    /** Each foot's placement on the floor (0) and on each rung it climbs. */
    footprints: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement[]
    >;

    /** Each foot's swing arc from one footprint to the next. */
    footArcs: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>[]
    >;

    /** Each leg's prepared placement on its rung. */
    goals: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    >;

    /** Each hand's grip point on each rung it holds, world metres. */
    handholds: Record<AutoMovieHumanSide, IAutoMovieVector3[]>;

    /** Each hand's path from one handhold to the next. */
    handArcs: Record<
      AutoMovieHumanSide,
      ReturnType<typeof Vector3.prepareLerp>[]
    >;
  }

  /**
   * Prepare the holds.
   *
   * @param body The canonical motion body.
   * @param ladder The ladder.
   * @param atRung The rung point reader.
   * @param quiet The settled stance's foot placements, whose headings the rungs keep.
   * @param flat Each foot's entry placement on the floor.
   * @param lateral Each foot's lateral place in the ladder frame, metres.
   * @param count How many rungs the feet climb.
   * @param reach The hands' first rung.
   * @param clearance The swing's clearance over a rung, metres.
   * @returns The holds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation A foot stands with its ball on the rung's top at its lateral place; a hand grips its rung in its shoulder's plane within the rung's width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Feet, their arcs and leg placements, then hands and their paths.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every hold comes from the ladder's rungs and the body's rest geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the rungs climbed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each placement and arc is prepared once and shared by every sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The arrays grow with the rungs climbed and are released with the plan.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    ladder: IAutoMovieMotionHumanLadder.ILadder,
    atRung: ReturnType<typeof HumanLadder.prepareRung>,
    quiet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    flat: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanFoot.IPlacement,
    lateral: (side: AutoMovieHumanSide) => number,
    count: number,
    reach: number,
    clearance: number,
  ): IHolds {
    // A foot's placement on a rung: the ball on the rung's top.
    const onRung: Record<
      "left" | "right",
      ReturnType<typeof HumanFoot.prepareAt>
    > = {
      left: HumanFoot.prepareAt(
        body,
        "left",
        "ball",
        HumanFoot.heading(quiet.left.rotation),
        0,
      ),
      right: HumanFoot.prepareAt(
        body,
        "right",
        "ball",
        HumanFoot.heading(quiet.right.rotation),
        0,
      ),
    };
    const footOn: (
      side: "left" | "right",
      index: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: "left" | "right",
      index: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      index === 0
        ? flat(side)
        : onRung[side](
            Vector3.add(atRung(index, lateral(side)), {
              x: 0,
              y: ladder.radius,
              z: 0,
            }),
          );
    const footprints: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement[]
    > = {
      left: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          footOn("left", i),
      ),
      right: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          footOn("right", i),
      ),
    };
    const footArcs: Record<
      "left" | "right",
      ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>[]
    > = {
      left: footprints.left
        .slice(1)
        .map(
          (
            to: IAutoMovieMotionHumanFoot.IPlacement,
            i: number,
          ): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =>
            AutoMovieMotionHumanLeg.prepareArc(
              footprints.left[i]!,
              to,
              clearance,
            ),
        ),
      right: footprints.right
        .slice(1)
        .map(
          (
            to: IAutoMovieMotionHumanFoot.IPlacement,
            i: number,
          ): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =>
            AutoMovieMotionHumanLeg.prepareArc(
              footprints.right[i]!,
              to,
              clearance,
            ),
        ),
    };
    const goals: Record<
      "left" | "right",
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    > = {
      left: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "left",
        footprints.left[1]!.rotation,
      ),
      right: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "right",
        footprints.right[1]!.rotation,
      ),
    };
    // Pick a grip in each shoulder's plane, within the rung's width.
    const halfWidth: number = ladder.width / 2;
    const handLane: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number =>
      Math.max(
        -halfWidth,
        Math.min(halfWidth, body.rest.get(`${side}UpperArm`)!.x),
      );
    const leftLane: number = handLane("left");
    const rightLane: number = handLane("right");
    const handholds: Record<AutoMovieHumanSide, IAutoMovieVector3[]> = {
      left: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieVector3 =>
          atRung(reach + i, leftLane),
      ),
      right: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieVector3 =>
          atRung(reach + i, rightLane),
      ),
    };
    const handArcs: Record<
      "left" | "right",
      ReturnType<typeof Vector3.prepareLerp>[]
    > = {
      left: handholds.left
        .slice(1)
        .map(
          (
            to: IAutoMovieVector3,
            i: number,
          ): ReturnType<typeof Vector3.prepareLerp> =>
            Vector3.prepareLerp(handholds.left[i]!, to),
        ),
      right: handholds.right
        .slice(1)
        .map(
          (
            to: IAutoMovieVector3,
            i: number,
          ): ReturnType<typeof Vector3.prepareLerp> =>
            Vector3.prepareLerp(handholds.right[i]!, to),
        ),
    };
    return { footprints, footArcs, goals, handholds, handArcs };
  }
}
