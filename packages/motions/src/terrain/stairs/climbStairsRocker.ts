import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../../actions/walkLeg";
import { HumanFoot } from "../../posture/HumanFoot";

/** One stair foot's placed rotation and toe flexion relative to its asked sole. */
interface IAutoMovieClimbStairsRocker {
  /** Ankle and sole orientation in world coordinates. */
  placement: IAutoMovieMotionHumanFoot.IPlacement;

  /** Toe flexion replacing the heel rocker's pitch change, degrees. */
  flexion: number;
}

/** A rocker with a fixed ankle orbit read at its current hip and bearing load. */
type AutoMovieClimbStairsRockerSource = (
  hip: IAutoMovieVector3,
  dorsal: number,
) => IAutoMovieClimbStairsRocker;
/** The record of `IItemEntryItem`'s site. */
type IItemEntryItem = { print: IPrintItemEntry };

/** The record of `IPrintItemEntry`'s site. */
type IPrintItemEntry = { placement: IAutoMovieMotionHumanFoot.IPlacement };

/**
 * Bind rigid stair rocker geometry to each material footprint.
 *
 * @param body The unchanged occupant and its sole sockets.
 * @param prints Each foot's fixed placements at tread contacts.
 * @returns A rocker at the current stance or swinging placement, hip and dorsal
 *   limit.
 */
export function climbStairsRocker(
  body: IAutoMovieMotionHumanBody,
  prints: Readonly<Record<AutoMovieHumanSide, readonly IItemEntryItem[]>>,
): (
  side: AutoMovieHumanSide,
  placement: IAutoMovieMotionHumanFoot.IPlacement,
  hip: IAutoMovieVector3,
  dorsal: number,
) => IAutoMovieClimbStairsRocker {
  /** Prepare the rigid forefoot and rocker geometry of one placement. */
  function prepare(
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
  ): AutoMovieClimbStairsRockerSource {
    const { heading, pitch }: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(placement.rotation);
    const ball: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "mtp",
      placement,
    );
    const rise: ReturnType<typeof walkLeg.prepareHeelRise> =
      walkLeg.prepareHeelRise(body, side, ball, heading, walkLeg.ROCKER);
    const turned: ReturnType<typeof HumanFoot.preparePivot> =
      HumanFoot.preparePivot(body, side, "mtp", ball, heading);
    return (
      hip: IAutoMovieVector3,
      dorsal: number,
    ): IAutoMovieClimbStairsRocker => {
      const reached: number = rise(hip, pitch, dorsal);
      if (reached === pitch) return { placement, flexion: 0 };
      return { placement: turned(reached), flexion: pitch - reached };
    };
  }

  const sources: Record<
    AutoMovieHumanSide,
    Map<IAutoMovieMotionHumanFoot.IPlacement, AutoMovieClimbStairsRockerSource>
  > = { left: new Map(), right: new Map() };
  for (const side of ["left", "right"] as const)
    for (const { print } of prints[side])
      sources[side].set(print.placement, prepare(side, print.placement));
  return (
    side: AutoMovieHumanSide,
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    hip: IAutoMovieVector3,
    dorsal: number,
  ): IAutoMovieClimbStairsRocker =>
    (sources[side].get(placement) ?? prepare(side, placement))(hip, dorsal);
}
