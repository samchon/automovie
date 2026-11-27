import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanClimbStairsFlight,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import type { HumanFrame } from "../../posture/internal/HumanFrame";

/**
 * The footprints of a stair climb: each foot's settled flat sole on its tread
 * at the standing lateral place, its leg placement and its sole points about
 * the ankle. `climbStairs` owns the flight and the timing.
 */
export namespace climbStairsPrints {
  /** A footprint: the foot's placement and the tread it is on, 0 for the floor. */
  export interface IPrint {
    /** The ankle and foot rotation, world metres. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The tread, 1 the first; 0 for the floor before the flight. */
    level: number;
  }

  /** The prepared footprints and the sole geometry they share. */
  export interface IPrints {
    /** Each foot's prepared leg placement. */
    goals: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    >;

    /**
     * Each foot's heel, ball and toe about its ankle: along the flight and in
     * height, metres.
     */
    soles: Record<AutoMovieHumanSide, IAutoMovieMotionHumanClearance.IPoint[]>;

    /** The footprint of a foot on a tread. */
    print(side: AutoMovieHumanSide, level: number): IPrint;

    /**
     * The least ankle height, metres, at a position along the flight that keeps
     * every sole point of the foot on or above the given surface profile.
     */
    required(
      side: AutoMovieHumanSide,
      profile: (z: number) => number,
    ): (z: number) => number;
  }

  /** One step of the schedule: the foot and the tread it goes to. */
  export interface IStep {
    /** The stepping foot. */
    side: AutoMovieHumanSide;

    /** The tread it goes to, 1 the first. */
    level: number;
  }

  /**
   * The step schedule: one foot per tread alternating from the lead, then the
   * trailing foot joins it on the last; or both feet on each tread, lead
   * first.
   *
   * @param pattern The stepping pattern.
   * @param count The treads.
   * @param lead The foot that steps first.
   * @returns The steps in order.
   */
  export function schedule(
    pattern: NonNullable<IAutoMovieMotionHumanClimbStairs.IParams["pattern"]>,
    count: number,
    lead: AutoMovieHumanSide,
  ): IStep[] {
    const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const steps: IStep[] = [];
    if (pattern === "stepOverStep") {
      for (let i: number = 1; i <= count; i++)
        steps.push({ side: i % 2 === 1 ? lead : trail, level: i });
      steps.push({ side: count % 2 === 1 ? trail : lead, level: count });
    } else
      for (let i: number = 1; i <= count; i++)
        steps.push({ side: lead, level: i }, { side: trail, level: i });
    return steps;
  }

  /** Dimensions needed to fit the sole's heel along the flight. */
  export type IRun = Pick<
    IAutoMovieMotionHumanClimbStairsFlight.IFlight,
    "first" | "tread" | "count"
  >;

  /** Centre a fitting sole or place its overhang on the permitted nosing. */
  export function heelOnTread(
    stairs: IRun,
    level: number,
    length: number,
    margin: number,
    sign: number,
  ): number {
    const edge: number = stairs.first + (level - 1) * stairs.tread;
    if (length <= stairs.tread - 2 * margin)
      return edge + (stairs.tread - length) / 2;
    // The last tread is the landing: it has no far edge to keep from.
    if (level === stairs.count) return edge + margin;
    return sign > 0 ? edge - margin : edge + stairs.tread + margin - length;
  }

  /**
   * Prepare the footprints.
   *
   * @param body The canonical motion body.
   * @param entered The entry's foot placements, the floor's footprints.
   * @param flats The settled stance's flat foot placements.
   * @param stairs The flight.
   * @param framed The flight's frame.
   * @param sign 1 up the flight, -1 down it.
   * @param margin The least distance of a sole from a nosing, metres.
   * @returns The footprints.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    entered: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    flats: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    stairs: IAutoMovieMotionHumanClimbStairsFlight.IFlight,
    framed: HumanFrame.IPrepared,
    sign: number,
    margin: number,
  ): IPrints {
    const goals: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    > = {
      left: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "left",
        flats.left.rotation,
      ),
      right: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "right",
        flats.right.rotation,
      ),
    };
    // The sole's heel, ball and toe about the ankle of a flat foot, along
    // the flight and in height.
    function soleOf(
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanClearance.IPoint[] {
      return (["heel", "ball", "toe"] as const).map(
        (point: SoleOfPoint): IAutoMovieMotionHumanClearance.IPoint => {
          const at: IAutoMovieVector3 = HumanFoot.point(
            body,
            side,
            point,
            flats[side],
          );
          return {
            z: framed.local(at).z - framed.local(flats[side].ankle).z,
            y: at.y - flats[side].ankle.y,
          };
        },
      );
    }
    const soles: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanClearance.IPoint[]
    > = {
      left: soleOf("left"),
      right: soleOf("right"),
    };
    const print: IPrints["print"] = (
      side: AutoMovieHumanSide,
      level: number,
    ): IPrint => {
      if (level === 0) return { placement: entered[side], level: 0 };
      const [heel, , toe]: IAutoMovieMotionHumanClearance.IPoint[] =
        soles[side];
      const length: number = toe!.z - heel!.z;
      const heelAt: number = heelOnTread(stairs, level, length, margin, sign);
      const ankle: IAutoMovieVector3 = flats[side].ankle;
      return {
        placement: {
          ankle: framed.point({
            x: framed.local(ankle).x,
            y: ankle.y + sign * level * stairs.riser,
            z: heelAt - heel!.z,
          }),
          rotation: flats[side].rotation,
        },
        level,
      };
    };
    const required: IPrints["required"] = (
      side: AutoMovieHumanSide,
      profile: (z: number) => number,
    ): ((z: number) => number) => {
      const points: readonly IAutoMovieMotionHumanClearance.IPoint[] =
        soles[side];
      return (z: number): number => {
        let height: number = -Infinity;
        for (const point of points)
          height = Math.max(height, profile(z + point.z) - point.y);
        return height;
      };
    };
    return { goals, soles, print, required };
  }
}

/** The alternatives of `SoleOfPoint`'s site. */
type SoleOfPoint = "heel" | "ball" | "toe";
