import type { IAutoMovieFramingGoal } from "@automovie/engine";

/**
 * The fight-coverage law: one moving camera inside the ring, side-on to the
 * fighters' line from the side away from the referee, wide while they reset,
 * medium while an exchange is live and pushed in on a clean landing; each
 * size holds at least 2.4 s, the camera orbits at no more than 0.9 rad/s and
 * follows with an operator's lag; at the finish it widens and holds, from the
 * open side the visibility law chooses.
 *
 * ```ts
 * CoverageLaw.goal("medium", ["a", "b"], bearing); // a framing goal
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#law Sizes, side-on bearing opposite the referee, 2.4 s holds, 0.9 rad/s orbit and the operator's lag.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#lens A normal-to-short-telephoto field of view without wide-angle distortion.
 */
export namespace CoverageLaw {
  /** A shot size. */
  export type Size = "wide" | "medium" | "close" | "finish";

  /** Least hold of a size, seconds (study: just under the 2.7 s action average). */
  export const HOLD: number = 2.4;

  /** Greatest orbit rate, radians per second (study, film choice). */
  export const ORBIT: number = 0.9;

  /** Time constant of the operator's follow, seconds: half a second, the referee's lag, so camera and official follow alike (film choice). */
  export const LAG: number = 0.5;

  /** Vertical field of view, radians: 40 degrees, a normal-to-short-telephoto lens on the 16:9 frame (settings lens kit). */
  export const FIELD_OF_VIEW: number = (40 * Math.PI) / 180;

  /** Camera elevation, radians: a slightly elevated ringside eye line of ten degrees (screenplay s01-b01). */
  export const ELEVATION: number = (10 * Math.PI) / 180;

  /** Share of the frame height the framed subjects fill, by size. */
  const FILL: Readonly<Record<Size, number>> = {
    wide: 0.75,
    medium: 0.9,
    close: 1,
    finish: 0.7,
  };

  /**
   * The framing goal of a size for subjects from a bearing.
   *
   * @param size The size.
   * @param subjects The framed subjects' ids.
   * @param bearing Bearing from the subjects' centre to the camera, radians.
   * @param elevation Lens elevation, radians; the law's ringside eye line unless the finish's visibility law raises it.
   * @returns The framing goal the engine resolves into a camera.
   * @evidence docs/research/cinematography/fight-coverage.md#law The sizes and the side-on bearing.
   */
  export function goal(
    size: Size,
    subjects: readonly string[],
    bearing: number,
    elevation: number = ELEVATION,
  ): IAutoMovieFramingGoal {
    // Wide sizes frame people spread along the floor, so their share is of
    // the 16:9 frame's width: the horizontal field of view sets the distance.
    const across: boolean = size === "wide" || size === "finish";
    const fieldOfView: number = across
      ? 2 * Math.atan(Math.tan(FIELD_OF_VIEW / 2) * ASPECT)
      : FIELD_OF_VIEW;
    return {
      subjects,
      fill: FILL[size],
      bearing,
      elevation,
      fieldOfView,
    };
  }

  /**
   * Farthest standpoint of the wide camera from the ring's centre, metres:
   * broadcast boxing's wide camera stands about 15 m away (SVG, HBO boxing
   * at Yankee Stadium). The wide and finish sizes may stand anywhere outside
   * the ropes up to it; the closer sizes are the apron's handheld work.
   */
  export const WIDE_DISTANCE: number = 15;

  /** Highest wide-camera lens above the arena floor, metres: about 7.5 m (SVG, HBO boxing at Yankee Stadium). */
  export const WIDE_HEIGHT: number = 7.5;

  /** Delivery frame aspect, width over height. */
  export const ASPECT: number = 16 / 9;

  /**
   * The side-on bearing across the fighters' line, on the side away from the referee.
   *
   * @param a Fighter A's floor point.
   * @param b Fighter B's floor point.
   * @param referee The referee's floor point.
   * @returns Bearing from the fighters' centre, radians from +Z toward +X.
   * @evidence docs/research/cinematography/fight-coverage.md#law Side-on, opposite the referee.
   */
  export function bearing(
    a: { x: number; z: number },
    b: { x: number; z: number },
    referee: { x: number; z: number },
  ): number {
    const dx: number = b.x - a.x;
    const dz: number = b.z - a.z;
    const nx: number = -dz;
    const nz: number = dx;
    const cx: number = (a.x + b.x) / 2;
    const cz: number = (a.z + b.z) / 2;
    const side: number =
      (referee.x - cx) * nx + (referee.z - cz) * nz >= 0 ? -1 : 1;
    return Math.atan2(side * nx, side * nz);
  }

  /**
   * One step of the orbit toward a bearing at no more than the orbit rate.
   *
   * @param current The current bearing, radians.
   * @param target The wanted bearing, radians.
   * @param seconds The step's duration.
   * @returns The next bearing.
   * @evidence docs/research/cinematography/fight-coverage.md#law At most 0.9 rad/s.
   */
  export function orbit(
    current: number,
    target: number,
    seconds: number,
  ): number {
    let delta: number = target - current;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const step: number = ORBIT * seconds;
    return current + Math.max(-step, Math.min(step, delta));
  }

  /**
   * The operator's follow: the share of the remaining distance closed in one step.
   *
   * @param seconds The step's duration.
   * @returns A share in (0, 1].
   * @evidence docs/research/cinematography/fight-coverage.md#law Follows with an operator's lag.
   */
  export function follow(seconds: number): number {
    return 1 - Math.exp(-seconds / LAG);
  }
}
