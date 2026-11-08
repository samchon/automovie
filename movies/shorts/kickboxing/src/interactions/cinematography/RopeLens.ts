import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A resolved framing held inside the ropes by an operator in the ring. The
 * lens keeps its floor position inside the square the ropes leave it and
 * its elevation above the target; when the ropes stop the dolly short of the
 * framing distance, the operator raises the camera toward that distance from
 * the target, but never above the height he can hold it overhead.
 *
 * ```ts
 * RopeLens.hold(resolveAutoMovieFraming(goal, spheres), ring.half - margin, goal.elevation, overhead);
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#targets The lens stays inside the ropes; medium and wide shots frame both fighters' whole bodies.
 * @evidence docs/research/cinematography/fight-coverage.md#law The camera rises no higher than an operator can hold it overhead.
 */
export namespace RopeLens {
  /** A held lens. */
  export interface IHeld {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at point, world metres. */
    target: IAutoMovieVector3;

    /** Whether the ropes held the lens back from the framing's position. */
    clamped: boolean;
  }

  /**
   * The lens of a framing held inside the ropes.
   *
   * @param frame The resolved framing's position and target.
   * @param limit Greatest floor coordinate the lens may take on either axis, metres.
   * @param elevation The framing's elevation above the target, radians.
   * @param overhead Greatest lens height a rope stop may raise it to, metres: the operator's overhead reach.
   * @returns The held lens.
   */
  export function hold(
    frame: { position: IAutoMovieVector3; target: IAutoMovieVector3 },
    limit: number,
    elevation: number,
    overhead: number,
  ): IHeld {
    const x: number = Math.max(-limit, Math.min(limit, frame.position.x));
    const z: number = Math.max(-limit, Math.min(limit, frame.position.z));
    const run: number = Math.hypot(x - frame.target.x, z - frame.target.z);
    const clamped: boolean = x !== frame.position.x || z !== frame.position.z;
    const needed: number = Math.hypot(
      frame.position.x - frame.target.x,
      frame.position.y - frame.target.y,
      frame.position.z - frame.target.z,
    );
    const level: number = run * Math.tan(elevation);
    const rise: number = clamped
      ? Math.max(
          level,
          Math.min(
            overhead - frame.target.y,
            Math.sqrt(Math.max(0, needed * needed - run * run)),
          ),
        )
      : level;
    return {
      position: { x, y: frame.target.y + rise, z },
      target: frame.target,
      clamped,
    };
  }
}
