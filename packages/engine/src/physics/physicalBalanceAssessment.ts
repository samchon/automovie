import type {
  IAutoMoviePhysicalBalance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalStanceSupport } from "./physicalStanceSupport";

/**
 * One capture-point assessment's shared state
 * (`AutoMoviePhysicalBalance.assess`): the readings it was asked about, the
 * capture point and its rate, the support's centroid and the capture point's
 * direction from it, and the swing's timing; with the support outline, timing
 * and convergence rules its steps share.
 */
export namespace physicalBalanceAssessment {
  /** The assessment's shared state. */
  export interface IAssessment {
    /** The readings and limits assessed. */
    input: IAutoMoviePhysicalBalance.IAssessInput;

    /** The pendulum's rate, per second. */
    omega: number;

    /** The capture point, on the floor. */
    capturePoint: IAutoMovieVector3;

    /** The margin the stance holds its centre of pressure inside, metres. */
    inset: number;

    /** The assessment before any step is chosen. */
    result: IAutoMoviePhysicalBalance.IResult;

    /** The supports' centroid. */
    centroid: IAutoMovieVector3;

    /** The capture point's horizontal offset from the centroid. */
    direction: IAutoMovieVector3;

    /** The offset's squared length. */
    denominator: number;

    /** The swing's timing, when its bounds are valid. */
    timing: IAutoMoviePhysicalBalance.IAssessInput["swing"];

    /** What a swing under way has spent, seconds. */
    spent: number;
  }

  /** The most passes the step's place and time take to agree. */
  export const PASSES: number = 20;

  /** The step target's change, metres, below which its place and time agree. */
  export const SETTLED: number = 1e-4;

  /**
   * The outline the stance holds its centre of pressure inside: the support
   * shrunk by the inset (Koolen et al., Corollary 3).
   */
  export function held(
    scope: Pick<IAssessment, "inset">,
    outline: IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    return scope.inset > 0
      ? physicalStanceSupport.shrink(outline, scope.inset)
      : outline;
  }

  /**
   * A swing over distance d lands after the unloading ramp and the quickest
   * minimum-jerk transfer the leg's acceleration bound allows.
   */
  export function swing(scope: IAssessment, distance: number): number {
    return scope.timing
      ? AutoMoviePhysicalBalance.duration(
          distance,
          scope.timing.height,
          scope.timing.acceleration,
        )
      : (scope.input.swingSeconds ?? 0);
  }

  /**
   * The capture point diverges through the unloading ramp, the swing and the
   * landed foot's ramp-in, less what a swing under way has spent: the target is
   * where it will be once the new foot bears (Khadiv et al. 2017, Section
   * III-B; Herzog et al. 2016, Section 5.3).
   */
  export function until(scope: IAssessment, distance: number): number {
    return Math.max(
      0,
      (scope.timing?.ramp ?? 0) +
        swing(scope, distance) +
        (scope.timing?.landing ?? 0) -
        scope.spent,
    );
  }

  /**
   * How far a point lies outside a convex floor polygon, metres: zero inside,
   * else its distance to the nearest edge; a polygon of fewer than three
   * vertices has no inside.
   */
  export function excess(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): number {
    let inside: boolean = polygon.length >= 3;
    let outside: number = Infinity;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IAutoMovieVector3 = polygon[i]!;
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const t: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.z - a.z) * dz) / denominator,
              ),
            );
      outside = Math.min(
        outside,
        Math.hypot(point.x - a.x - dx * t, point.z - a.z - dz * t),
      );
      if (dx * (point.z - a.z) - dz * (point.x - a.x) < 0) inside = false;
    }
    return inside ? 0 : outside;
  }
}
