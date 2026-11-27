import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import { AutoMovieArchetypeBoat } from "../AutoMovieArchetypeBoat";

/**
 * An open boat's hull boards: its flat side panels and its thwarts with their
 * seats, and the paint and bare wood they are drawn in.
 */
export namespace BoatHull {
  /** The hull's paint. */
  export const PAINT: string = "#2f5d50";

  /** Bare wood. */
  export const WOOD: string = "#a07a4a";

  /**
   * Add one flat side panel from one end's foot to another's, the gunwale's
   * height above the bottom.
   *
   * @param builder The boat under construction.
   * @param id The panel's part id.
   * @param from One end of its foot, `Y` ignored.
   * @param to The other end.
   * @param bottom The bottom's height.
   * @param gunwale The gunwale's height.
   */
  export function panel(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBoat.Affordance,
      AutoMovieArchetypeBoat.Dimension
    >,
    id: string,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    bottom: number,
    gunwale: number,
  ): void {
    const run: number = Math.hypot(to.x - from.x, to.z - from.z);
    const yaw: number =
      Math.atan2(to.x - from.x, to.z - from.z) / AutoMovieArchetypeUnits.DEGREE;
    builder.box(
      id,
      Vector3.create(
        AutoMovieArchetypeBoat.ESTIMATES.plank,
        gunwale - bottom,
        run,
      ),
      Vector3.create(
        (from.x + to.x) / 2,
        (gunwale + bottom) / 2,
        (from.z + to.z) / 2,
      ),
      {
        color: PAINT,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
      },
    );
  }

  /**
   * Add one thwart and its seat: a board across the boat, its `seat` on its
   * front edge, the edge the sitter faces from.
   *
   * @param builder The boat under construction.
   * @param id The seat's affordance id.
   * @param height The board's top.
   * @param edge The station of its front edge, the sitter's knees' side.
   * @param width Its width across.
   * @param facing 1 for a sitter facing the bow, -1 for one facing the stern.
   * @param workingSeat Whether the sitter works on the oars from this fixed
   *   bearing.
   */
  export function thwart(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBoat.Affordance,
      AutoMovieArchetypeBoat.Dimension
    >,
    id: AutoMovieArchetypeBoat.Affordance,
    height: number,
    edge: number,
    width: number,
    facing: number,
    workingSeat: boolean = false,
  ): void {
    const depth: number = AutoMovieArchetypeBoat.THWART;
    const board: number = AutoMovieArchetypeBoat.ESTIMATES.seat;
    builder.box(
      `seat-${id}`,
      Vector3.create(width, board, depth),
      Vector3.create(0, height - board / 2, edge - (facing * depth) / 2),
      {
        color: WOOD,
        surface: "wood",
      },
    );
    builder.affordance({
      id,
      kind: "seat",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, height, edge),
        Vector3.create(0, 1, 0),
        Vector3.create(facing, 0, 0),
      ),
      extent: null,
      depth,
      width,
      ...(workingSeat ? { workingSeat } : {}),
    });
  }
}
