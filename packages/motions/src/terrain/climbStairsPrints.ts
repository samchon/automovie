import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanClimbStairsFlight,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../posture/HumanFoot";
import type { HumanFrame } from "../posture/HumanFrame";

/**
 * The footprints of a stair climb: each foot's settled flat sole on its
 * tread at the standing lateral place, its leg placement and its sole
 * points about the ankle. `climbStairs` owns the flight and the timing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared, its frames and its owner.
 * @evidence contracts/development/design.md#principled-representation A footprint is a foot placement in world metres with its tread level.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The footprint record, the prepared set and the one builder climbStairs.plan calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every footprint comes from the flight and the settled stance.
 */
export namespace climbStairsPrints {
  /**
   * A footprint: the foot's placement and the tread it is on, 0 for the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members and their units.
   * @evidence contracts/development/design.md#principled-representation An ankle placement in world metres and a tread index.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two fields the climb's schedule reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by prepare.
   */
  export interface IPrint {
    /** The ankle and foot rotation, world metres. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The tread, 1 the first; 0 for the floor before the flight. */
    level: number;
  }

  /**
   * The prepared footprints and the sole geometry they share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation Per-foot leg placements, sole points about the ankle in the flight frame, and a memoized footprint reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three members climbStairs.plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only after preparation.
   */
  export interface IPrints {
    /** Each foot's prepared leg placement. */
    goals: Record<
      AutoMovieHumanSide,
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    >;

    /** Each foot's heel, ball and toe about its ankle: along the flight and in height, metres. */
    soles: Record<AutoMovieHumanSide, IAutoMovieMotionHumanClearance.IPoint[]>;

    /** The footprint of a foot on a tread, memoized. */
    print(side: AutoMovieHumanSide, level: number): IPrint;

    /**
     * The least ankle height, metres, at a position along the flight that
     * keeps every sole point of the foot on or above the given surface profile.
     */
    required(
      side: AutoMovieHumanSide,
      profile: (z: number) => number,
    ): (z: number) => number;
  }

  /**
   * One step of the schedule: the foot and the tread it goes to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation A foot and a tread index, 1 the first.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two fields the climb's clock and prints read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by schedule.
   */
  export interface IStep {
    /** The stepping foot. */
    side: AutoMovieHumanSide;

    /** The tread it goes to, 1 the first. */
    level: number;
  }

  /**
   * The step schedule: one foot per tread alternating from the lead, then the
   * trailing foot joins it on the last; or both feet on each tread, lead first.
   *
   * @param pattern The stepping pattern.
   * @param count The treads.
   * @param lead The foot that steps first.
   * @returns The steps in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both patterns and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Step-over-step alternates feet tread by tread; step-by-step brings both feet to each tread.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop per pattern.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every tread is stepped in order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the treads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation A sole shorter than the tread less two edges is centred on it; a longer one keeps its heel or toe the edge from the nosing it would overhang, the landing having no far edge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Leg placements, sole points, then one memoized footprint reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every footprint follows from the flight's treads and the settled feet.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each footprint is computed once per foot and tread.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Footprints are memoized by foot and tread.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo grows with the treads stepped and is released with the plan.
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
      "left" | "right",
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
      side: "left" | "right",
    ): IAutoMovieMotionHumanClearance.IPoint[] {
      return (["heel", "ball", "toe"] as const).map(
        (
          point: "heel" | "ball" | "toe",
        ): IAutoMovieMotionHumanClearance.IPoint => {
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
      "left" | "right",
      IAutoMovieMotionHumanClearance.IPoint[]
    > = {
      left: soleOf("left"),
      right: soleOf("right"),
    };
    const printOf: (side: "left" | "right", level: number) => IPrint = (
      side: "left" | "right",
      level: number,
    ): IPrint => {
      if (level === 0) return { placement: entered[side], level: 0 };
      const [heel, , toe]: IAutoMovieMotionHumanClearance.IPoint[] =
        soles[side];
      const length: number = toe!.z - heel!.z;
      const edge: number = stairs.first + (level - 1) * stairs.tread;
      // The last tread is the landing: it has no far edge to keep from.
      const heelAt: number =
        length <= stairs.tread - 2 * margin
          ? edge + (stairs.tread - length) / 2
          : level === stairs.count
            ? edge + margin
            : sign > 0
              ? edge - margin
              : edge + stairs.tread + margin - length;
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
    const footprints: Record<"left" | "right", Map<number, IPrint>> = {
      left: new Map(),
      right: new Map(),
    };
    const print: (side: "left" | "right", level: number) => IPrint = (
      side: "left" | "right",
      level: number,
    ): IPrint => {
      let out: IPrint | undefined = footprints[side].get(level);
      if (out === undefined)
        footprints[side].set(level, (out = printOf(side, level)));
      return out;
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
