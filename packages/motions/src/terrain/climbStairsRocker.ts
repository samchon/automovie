import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../actions/walkLeg";
import { HumanFoot } from "../posture/HumanFoot";

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

/**
 * Bind rigid stair rocker geometry to each material footprint.
 *
 * @param body The unchanged occupant and its sole sockets.
 * @param prints Each foot's fixed placements at tread contacts.
 * @returns A rocker at the current stance or swinging placement, hip and dorsal limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed material-footprint premise, moving hip, dorsal limit and transient swing.
 * @evidence contracts/development/implementation.md#principled-implementation The exact rocker evaluates each stance on its forefoot material point. Its pitch orbit does not depend on hip height or load; both actual values still enter the room equation. Swing placements each define their own orbit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Bind one exact source per declared footprint, select the source with the current placement, and evaluate its current rocker.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Swing gets the ordinary moving-foot geometry. Each stance and swing reads the same ankle range and reach constraints as the original rocker.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed reader per footprint. Each later stance read keeps its heading, sole pivot, orbit and body terms. The actual rocker and moving-swing work remain.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Planted placement identity belongs to the stair plan's immutable footprint, while each hip and dorsal-limit pair is evaluated freshly.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fixed geometry releases with the plan. Swing sources and all queried placements release with their current sample.
 */
export function climbStairsRocker(
  body: IAutoMovieMotionHumanBody,
  prints: Readonly<
    Record<
      AutoMovieHumanSide,
      readonly { print: { placement: IAutoMovieMotionHumanFoot.IPlacement } }[]
    >
  >,
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
    let turned: ReturnType<typeof HumanFoot.preparePivot> | undefined;
    return (
      hip: IAutoMovieVector3,
      dorsal: number,
    ): IAutoMovieClimbStairsRocker => {
      const reached: number = rise(hip, pitch, dorsal);
      if (reached === pitch) return { placement, flexion: 0 };
      turned ??= HumanFoot.preparePivot(body, side, "mtp", ball, heading);
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
