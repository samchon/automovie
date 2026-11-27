import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { EquineHeadReach } from "./EquineHeadReach";

/*
 * The neck and head dips a course may pass through, degrees of neck pitch, the
 * head pitching half as far: authored candidates, the direct path first.
 */
const DIPS: readonly number[] = [15, 30, 45, 60, 75];

/*
 * The shares at which a course is checked for clearance, end shares included.
 */
const CHECKS: number = 12;

/*
 * The clearance a course may close to at its end, metres: a touching reach
 * meets its target there.
 */
const TOUCH: number = 1e-3;

/*
 * The unit quaternion.
 */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/*
 * The head channel's course from one carriage of the neck and head to another,
 * planned around another body.
 *
 * The neck is the bar from its root to the poll and the head the bar from the
 * poll to the muzzle's end, each a capsule of its drawn radius. A course runs
 * straight from the start turns to the goal turns, each bar's turn slerped by
 * the share, when that path keeps both bars clear of every bar of the other
 * body at `CHECKS` shares; otherwise it passes through the first of the
 * authored dips (`DIPS`, the carriage `EquineHeadReach.pitched` gives) whose
 * two legs, start to dip over the first half and dip to goal over the second,
 * keep them clear. No course clears, and it refuses. It is the head's
 * counterpart of planning an arm's course around obstacles: closed-form legs,
 * chosen from a short authored list by an exact segment-distance test.
 */
export namespace EquineHeadCourse {
  /*
   * A bar of the other body: a capsule's segment and radius in this animal's
   * model space.
   */
  export interface IObstacle {
    /*
     * The bar's part id.
     */
    id: string;

    /*
     * One end.
     */
    from: IAutoMovieVector3;

    /*
     * The other end.
     */
    to: IAutoMovieVector3;

    /*
     * The radius.
     */
    radius: number;
  }

  /*
   * The neck's and head's drawn radii.
   */
  export interface IRadii {
    /*
     * The neck bar's radius.
     */
    neck: number;

    /*
     * The head bar's radius.
     */
    head: number;
  }

  /*
   * A chosen course: the turns it passes through, the start itself for a direct
   * course.
   */
  export interface IPath {
    /*
     * Whether the course runs straight from start to goal.
     */
    direct: boolean;

    /*
     * The dip it passes through when not direct.
     */
    via: EquineHeadReach.ITurn;
  }

  /*
   * Plan a course from start turns to goal turns around another body.
   * Parameter bars: The current bars.
   * Parameter radii: The neck's and head's radii.
   * Parameter start: The turns the course starts from.
   * Parameter goal: The turns it ends at.
   * Parameter obstacles: The other body's bars.
   * Returns: The course.
   * When no candidate course clears the other body.
   */
  export function plan(
    bars: EquineHeadReach.IBars,
    radii: IRadii,
    start: EquineHeadReach.ITurn,
    goal: EquineHeadReach.ITurn,
    obstacles: readonly IObstacle[],
  ): IPath {
    const direct: IPath = { direct: true, via: start };
    if (obstacles.length === 0) return direct;
    let best: IClearance = clearance(
      bars,
      radii,
      start,
      goal,
      direct,
      obstacles,
    );
    if (best.gap >= 0) return direct;
    for (const dip of DIPS) {
      const path: IPath = {
        direct: false,
        via: EquineHeadReach.pitched(bars, dip, dip / 2),
      };
      const clear: IClearance = clearance(
        bars,
        radii,
        start,
        goal,
        path,
        obstacles,
      );
      if (clear.gap >= 0) return path;
      if (clear.gap > best.gap) best = clear;
    }
    throw new RangeError(
      `No head course clears the other body: the best still passes ${-best.gap} m into its ${best.where}`,
    );
  }

  /*
   * The turns a course shows at a share.
   * Parameter path: The course.
   * Parameter start: Its start turns.
   * Parameter goal: Its goal turns.
   * Parameter share: The share, 0 to 1.
   * Returns: The turns to show in full.
   */
  export function shown(
    path: IPath,
    start: EquineHeadReach.ITurn,
    goal: EquineHeadReach.ITurn,
    share: number,
  ): EquineHeadReach.ITurn {
    if (path.direct) return between(start, goal, share);
    return share <= 0.5
      ? between(start, path.via, 2 * share)
      : between(path.via, goal, 2 * share - 1);
  }

  /*
   * The rest carriage: no turn.
   * Returns: The identity turns.
   */
  export function rest(): EquineHeadReach.ITurn {
    return { neck: IDENTITY, head: IDENTITY };
  }

  /*
   * Each bar slerped between two turns.
   */
  function between(
    from: EquineHeadReach.ITurn,
    to: EquineHeadReach.ITurn,
    share: number,
  ): EquineHeadReach.ITurn {
    return {
      neck: Quaternion.slerp(from.neck, to.neck, share),
      head: Quaternion.slerp(from.head, to.head, share),
    };
  }

  /*
   * A course's least clearance from every obstacle over its checked shares, its
   * end allowed to touch: negative where it passes into one.
   */
  function clearance(
    bars: EquineHeadReach.IBars,
    radii: IRadii,
    start: EquineHeadReach.ITurn,
    goal: EquineHeadReach.ITurn,
    path: IPath,
    obstacles: readonly IObstacle[],
  ): IClearance {
    let least: IClearance = { gap: Infinity, where: "" };
    const along: IAutoMovieVector3 = Quaternion.rotateVector(bars.head, {
      x: 0,
      y: 1,
      z: 0,
    });
    const nose: IAutoMovieVector3 = Vector3.addScaled(
      bars.poll,
      along,
      bars.muzzle - radii.head,
    );
    for (let k: number = 0; k <= CHECKS; k++) {
      const share: number = k / CHECKS;
      const turn: EquineHeadReach.ITurn = shown(path, start, goal, share);
      const poll: IAutoMovieVector3 = Vector3.add(
        bars.root,
        Quaternion.rotateVector(
          turn.neck,
          Vector3.subtract(bars.poll, bars.root),
        ),
      );
      const tip: IAutoMovieVector3 = Vector3.add(
        poll,
        Quaternion.rotateVector(turn.head, Vector3.subtract(nose, bars.poll)),
      );
      const allowance: number = k === CHECKS ? TOUCH : 0;
      for (const obstacle of obstacles) {
        const neck: number =
          gap(bars.root, poll, radii.neck, obstacle) + allowance;
        const head: number = gap(poll, tip, radii.head, obstacle) + allowance;
        if (neck < least.gap)
          least = {
            gap: neck,
            where: `${obstacle.id} with the neck at share ${share}`,
          };
        if (head < least.gap)
          least = {
            gap: head,
            where: `${obstacle.id} with the head at share ${share}`,
          };
      }
    }
    return least;
  }

  /*
   * The clearance between a capsule and an obstacle.
   */
  function gap(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    radius: number,
    obstacle: IObstacle,
  ): number {
    return (
      AutoMovieEngineMath.closestPointsBetweenSegments(from, to, obstacle.from, obstacle.to)
        .distance -
      radius -
      obstacle.radius
    );
  }
}

/*
 * A course's least clearance and where it is least.
 */
interface IClearance {
  /*
   * Metres; negative where the course passes into a bar.
   */
  gap: number;

  /*
   * The bar, the moving bar and the share.
   */
  where: string;
}
