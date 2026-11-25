import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * Inserting a held prop along a socket's axis: a rammer down a bore, a sword
 * into its scabbard, a magazine into its well, an arrow back into a quiver, a
 * key into a lock.
 *
 * The hand holds the prop as it entered the operation (`StrikingHeld`) and the
 * goal is the prop's working point (`tip`) on the socket's axis: at the
 * socket's mouth when the stroke begins, then pushed in along the axis, the
 * inverse of the socket's outward normal, by `depth`. The prop's line is kept
 * on the axis, so the hand's place and turn follow from the prop's own line as
 * the hand holds it (`StrikingRoll.hand`), and the elbow is placed by the bend
 * search. With `withdraw` the prop is drawn back out over the second half of
 * the stroke along the same axis: the depth at a progress `p` of the stroke is
 * `depth (1 - cos 2 pi p) / 2`, at rest at the mouth, at the bottom and at the
 * mouth again, so the reversal at the bottom has no jump in speed. Without it
 * the depth is `depth p`, and the prop is left home.
 */
export namespace IAutoMovieMotionHumanOperateInsert {
  /** A held prop inserted into a socket. */
  export interface IMechanism {
    /** The discriminator. */
    kind: "insert";

    /** The held prop's subject. */
    prop: string;

    /**
     * The held prop's working point that leads into the socket; `tip` when
     * absent.
     */
    tip?: string;

    /** The socket: its mouth, its normal pointing out along the axis. */
    into: IAutoMovieMotionTarget;

    /**
     * How far the working point goes in, metres; positive. The socket's own
     * declared depth (IAutoMovieAffordance.depth, a bore's length) when
     * absent.
     */
    depth?: number;

    /** Whether the prop is drawn back out over the stroke's second half. */
    withdraw?: boolean;
  }

  /**
   * The arm's goal at a progress of the stroke: the grip that puts the held
   * prop's working point on the socket's axis at its depth, the prop's line
   * along the axis. Input socket of operateInsert.target. The socket's mouth
   * and outward normal, world.
   */
  export type ITargetSocket = {
    /** Socket contact point in world metres. */
    point: IAutoMovieVector3;
    /**
     * Outward socket normal in world coordinates; insertion follows its
     * normalised opposite.
     */
    normal: IAutoMovieVector3;
  };
}
