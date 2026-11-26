import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLadder,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanLadder } from "./HumanLadder";

/**
 * The holds of a rung-ladder climb: each foot's placement on every rung it
 * stands on with its swing arc between them, each hand's grip point on every
 * rung it holds with its path between them, and the legs' placements.
 * `climbLadder` owns the beats and the clock.
 */
export namespace climbLadderHolds {
  /**
   * How far below the shoulder the hands' first rung is sought, upper-arm
   * lengths (provisional: a grip with the elbow part bent rather than a
   * straight overhead reach).
   */
  export const GRIP_DROP: number = 0.5;

  /** The prepared holds. */
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

  /** The bounds a standing entry must meet before the ladder. */
  export interface IBounds {
    /** Largest turn from the ladder's heading, degrees. */
    facing: number;

    /** Largest distance of the toes from the rungs, metres. */
    near: number;

    /**
     * How far below the shoulder the first hand rung is sought, upper-arm
     * lengths.
     */
    gripDrop: number;
  }

  /** An admitted entry: each foot's lateral place and the hands' first rung. */
  export interface IAdmitted {
    /** Each foot's lateral place in the ladder frame, metres. */
    lateral: Record<AutoMovieHumanSide, number>;

    /** The hands' first rung. */
    reach: number;
  }

  /**
   * Admit a standing entry before the ladder.
   *
   * @param body The canonical motion body.
   * @param ladder The ladder.
   * @param yaw The standing heading, degrees.
   * @param flats The entry's foot placements.
   * @param count How many rungs the feet climb.
   * @param bounds The climb's bounds.
   * @returns The lateral places and the hands' first rung.
   * @throws {HumanRefusal} When the climber does not face the ladder, stands
   *   too far from it or beside it, or the ladder has too few rungs above the
   *   hands.
   */
  export function admit(
    body: IAutoMovieMotionHumanBody,
    ladder: IAutoMovieMotionHumanLadder.ILadder,
    yaw: number,
    flats: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    count: number,
    bounds: IBounds,
  ): IAdmitted {
    const frame: IAutoMovieMotionHumanLadder.ILadder["frame"] = ladder.frame;
    const turned: number = Math.abs(AutoMovieEngineMath.wrapDegrees(yaw - frame.yaw));
    HumanBound.within("facing", turned, 0, bounds.facing, "degrees");
    const toe: number = Math.max(
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): number =>
          HumanFrame.local(
            frame,
            HumanFoot.point(body, side, "toe", flats[side]),
          ).z,
      ),
    );
    HumanBound.within("toes", -toe, 0, bounds.near, "m");
    const lateral: Record<AutoMovieHumanSide, number> = {
      left: HumanFrame.local(frame, flats.left.ankle).x,
      right: HumanFrame.local(frame, flats.right.ankle).x,
    };
    HumanBound.within(
      "beside",
      Math.abs((lateral.left + lateral.right) / 2),
      0,
      ladder.width / 2,
      "m",
    );
    const gripHeight: number =
      body.measure.shoulderHeight - bounds.gripDrop * body.measure.upperArm;
    const reach: number =
      ladder.rungs === undefined
        ? Math.round(gripHeight / ladder.spacing)
        : ladder.rungs.reduce(
            (
              nearest: number,
              rung: IAutoMovieMotionHumanLadder.IRung,
              index: number,
            ): number =>
              Math.abs(rung.center.y - ladder.frame.origin.y - gripHeight) <
              Math.abs(
                ladder.rungs![nearest - 1]!.center.y -
                  ladder.frame.origin.y -
                  gripHeight,
              )
                ? index + 1
                : nearest,
            1,
          );
    HumanBound.within("rungs", reach + count, 1, ladder.count, "");
    for (const rung of ladder.rungs?.slice(0, count) ?? [])
      for (const side of ["left", "right"] as const)
        HumanBound.within(
          `${rung.id}.${side}Foot`,
          Math.abs(lateral[side]),
          0,
          rung.width / 2,
          "m",
        );
    return { lateral, reach };
  }

  /**
   * Prepare the holds.
   *
   * @param body The canonical motion body.
   * @param atRung The rung point reader.
   * @param quiet The settled stance's foot placements, whose headings the rungs
   *   keep.
   * @param flat Each foot's entry placement on the floor.
   * @param lateral Each foot's lateral place in the ladder frame, metres.
   * @param count How many rungs the feet climb.
   * @param reach The hands' first rung.
   * @param clearance The swing's clearance over a rung, metres.
   * @returns The holds.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
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
      AutoMovieHumanSide,
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
      side: AutoMovieHumanSide,
      index: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
      index: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      index === 0
        ? flat(side)
        : onRung[side](atRung(index, lateral(side), "crown"));
    const footprints: Record<
      AutoMovieHumanSide,
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
      AutoMovieHumanSide,
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
      AutoMovieHumanSide,
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
    const handLane: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => body.rest.get(`${side}UpperArm`)!.x;
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
      AutoMovieHumanSide,
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
