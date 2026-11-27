import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A stair rail's line in the world, as a hand slides along it: the bar's
 * centre, its axis and its up, and how far along the axis either way the hand
 * can hold, the bar's half length less half its aperture.
 * Parameter model: The stair prop's world frame.
 * Parameter bar: The rail's bar affordance, with its length.
 * Returns: The line, or null for a bar that does not run along the flight, its
 * axis within 60 degrees of the vertical.
 */
export function climbStairsRailLine(
  model: IAutoMovieRigidTransform,
  bar: Pick<IAutoMovieAffordance, "frame" | "aperture"> & { length: number },
): climbStairsRailLine.ILine | null {
  const turn: IAutoMovieQuaternion = Quaternion.multiply(
    model.rotation,
    bar.frame.rotation,
  );
  const center: IAutoMovieVector3 = Vector3.add(
    model.position,
    Quaternion.rotateVector(model.rotation, bar.frame.translation),
  );
  const along: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
    x: 1,
    y: 0,
    z: 0,
  });
  const level: number = along.x * along.x + along.z * along.z;
  if (level < climbStairsRailLine.LEVEL) return null;
  const end: number = Math.max(0, bar.length / 2 - (bar.aperture ?? 0) / 2);
  return {
    center,
    along,
    normal: Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 }),
    end,
    point: (root: IAutoMovieVector3): IAutoMovieVector3 => {
      const z: number =
        ((root.x - center.x) * along.x + (root.z - center.z) * along.z) / level;
      return Vector3.add(
        center,
        Vector3.scale(along, Math.max(-end, Math.min(end, z))),
      );
    },
  };
}

/*
 * Companion constants and types of climbStairsRailLine.
 */
export namespace climbStairsRailLine {
  /*
   * The least squared horizontal share of a rail's unit axis, a quarter: an
   * axis within 60 degrees of the vertical runs up a post, not along a flight.
   */
  export const LEVEL: number = 0.25;

  /*
   * A rail's line.
   */
  export interface ILine {
    /*
     * The bar's centre, world metres.
     */
    center: IAutoMovieVector3;

    /*
     * The bar's unit axis.
     */
    along: IAutoMovieVector3;

    /*
     * The bar's unit up.
     */
    normal: IAutoMovieVector3;

    /*
     * How far either way along the axis a hand can hold, metres.
     */
    end: number;

    /*
     * Where on the rail a hand holds for a root: the root's horizontal place
     * read along the axis, kept within `end`.
     */
    point: (root: IAutoMovieVector3) => IAutoMovieVector3;
  }
}
