import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLimbFitFrame,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The frame a limb fit is remembered in (`HumanLimbFit.remembered`): the
 * root's floor point and heading, so two people of one body doing the same
 * thing in different places, or one body facing another way, share one fit.
 *
 * A pose and its goal are moved into the frame by taking away the root's
 * floor point (its x and z; heights are kept) and turning by minus its
 * heading about +Y; the limb solver reads only the geometry relative to the
 * root, so a fit solved in the frame is the fit solved in the world, moved.
 * The fitted pose is handed back with the caller's own root, since a limb
 * fit changes the limb's joints and not the root; its seed (the swivel and
 * branch of `fitSeededChainToTarget`) lives in the chain root's bone-local
 * frame, which a turn about +Y and a floor translation leave as they are, so
 * it is handed back unchanged. A goal attached to a bone (`on`), or kept
 * clear of or resting on other bodies' colliders (`clear`, `rests`), names
 * world things the frame would have to carry, and is keyed in the world as
 * before; so is a pose without a root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, why a fit is invariant in it, what is handed back unchanged and why, and which goals stay in the world.
 * @evidence contracts/development/design.md#principled-representation A rigid frame on the floor plan: a translation in x and z and a turn about +Y, kept as both quaternions so moving in and out is one multiplication each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The frame, moving a pose, a goal and a point into it, the key's grid (`grid`, `GRID`), and the memory's hit counts; `HumanLimbFit.remembered` is the one caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No goal is moved that names a world collider: it is keyed in the world, not approximated.
 */
export namespace HumanLimbFitFrame {
  /**
   * The frame a fit of a pose and a goal is remembered in, or null when it
   * stays in the world.
   *
   * @param pose The pose before the fit.
   * @param goal The limb's goal.
   * @returns The frame, or null.
   */
  export function of(
    pose: IAutoMoviePose,
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieMotionHumanLimbFitFrame.IFrame | null {
    if (
      pose.root === null ||
      goal.on !== undefined ||
      goal.clear !== undefined ||
      goal.rests !== undefined
    )
      return null;
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      pose.root.rotation,
      { x: 0, y: 0, z: 1 },
    );
    const heading: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
    return {
      x: pose.root.translation.x,
      z: pose.root.translation.z,
      into: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -heading),
    };
  }

  /**
   * A world point in the frame.
   *
   * @param frame The frame.
   * @param point The point, world metres.
   * @returns The point in the frame.
   */
  export function point(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(frame.into, {
      x: point.x - frame.x,
      y: point.y,
      z: point.z - frame.z,
    });
  }

  /**
   * A pose in the frame: its root moved and turned; its joints as they are.
   *
   * @param frame The frame.
   * @param pose The pose, with a root.
   * @returns The pose in the frame.
   */
  export function pose(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    pose: IAutoMoviePose,
  ): IAutoMoviePose {
    if (pose.root === null) return pose;
    return {
      ...pose,
      root: {
        ...pose.root,
        translation: point(frame, pose.root.translation),
        rotation: Quaternion.multiply(frame.into, pose.root.rotation),
      },
    };
  }

  /**
   * A goal in the frame: its point and bend moved and its rotation turned;
   * everything else as it is, its contact too, which lies in the end joint's
   * own rest frame (`HumanPosture.IGoal.contact`) and turns with the joint.
   *
   * @param frame The frame.
   * @param goal The goal, attached to no bone and naming no collider.
   * @returns The goal in the frame.
   */
  export function goal(
    frame: IAutoMovieMotionHumanLimbFitFrame.IFrame,
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieHumanLimbGoal {
    return {
      ...goal,
      point: point(frame, goal.point),
      bend: point(frame, goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(frame.into, goal.rotation) }),
    };
  }

  /**
   * A key's number on the memory's grid (`GRID`), for `JSON.stringify`: a
   * pose and a goal moved into the frame from two places or headings differ
   * by the rounding of the move, a few units in the last place of a double
   * (about 1e-15 of a metre or a unit quaternion), so their exact digits
   * never meet; read on the grid they are one key. Every other value is
   * kept as it is.
   *
   * @param _ The member's name, unread.
   * @param value The member's value.
   * @returns A number as its whole count of `GRID`, any other value as it is.
   */
  export function grid(_: string, value: unknown): unknown {
    return typeof value === "number" ? Math.round(value / GRID) : value;
  }

  /**
   * The memory key's resolution, in metres and in units of a quaternion or
   * an angle: a thousand times the rounding of a move into the frame, so two
   * copies of one fit read the same key but for the rare value that falls
   * on a step of the grid, which is only solved again; and a thousand times
   * finer than the 1e-9 m to which #3463 holds a moved fit to its original,
   * so two inputs read as one differ by less than that acceptance reads.
   */
  export const GRID: number = 1e-12;

  /**
   * Count a read of a body's memory.
   *
   * @param body The body.
   * @param hit Whether the fit was read from the memory.
   */
  export function count(body: IAutoMovieMotionHumanBody, hit: boolean): void {
    const counts: IAutoMovieMotionHumanLimbFitFrame.IStatistics = COUNTS.get(
      body,
    ) ?? { hits: 0, misses: 0 };
    if (hit) counts.hits += 1;
    else counts.misses += 1;
    COUNTS.set(body, counts);
  }

  /**
   * A body's fit memory counts since the process began.
   *
   * @param body The body.
   * @returns Its hits and misses.
   */
  export function statistics(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanLimbFitFrame.IStatistics {
    const counts: IAutoMovieMotionHumanLimbFitFrame.IStatistics | undefined =
      COUNTS.get(body);
    return { hits: counts?.hits ?? 0, misses: counts?.misses ?? 0 };
  }

  /** The counts, by body, released with the body. */
  const COUNTS: WeakMap<
    IAutoMovieMotionHumanBody,
    IAutoMovieMotionHumanLimbFitFrame.IStatistics
  > = new WeakMap();
}
