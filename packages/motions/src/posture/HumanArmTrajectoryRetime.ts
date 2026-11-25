import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMAN_ARM_COORDINATE_ACCELERATIONS as ACCELERATIONS } from "./HUMAN_ARM_COORDINATE_ACCELERATIONS";
import { HUMAN_ARM_COORDINATE_RATES as RATES } from "./HUMAN_ARM_COORDINATE_RATES";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanMinimumJerkSpline as S } from "./HumanMinimumJerkSpline";
import { HumanPathParameterization as TOPP } from "./HumanPathParameterization";

/**
 * A laid course's time-optimal timing along its own path, and the course
 * retimed on it: TOPP-RA (`HumanPathParameterization`, Pham and Pham 2018) on
 * the path the course plays, its parameter the course's own seconds. The
 * joints stay within their velocity and acceleration limits, and each probe
 * against its base within the law's own pace (`M.IContext.speed`). The path's
 * derivatives at the gridpoints are those of the minimum-jerk path through the
 * course (`HumanMinimumJerkSpline`), the curve the course is played on. The
 * paper's premise is a fixed path: a retimed course is read again in full, so
 * whatever moves around it in time is read at the new instants.
 */
export namespace HumanArmTrajectoryRetime {
  /**
   * The time-optimal timing of a course along its path, at rest at both ends.
   *
   * @param c The context at the course's instants.
   * @param x Each arm's coordinates at each instant.
   * @returns The parameterisation and its time map; the map's last time is the
   *   least duration that keeps every limit.
   */
  export function timing(
    c: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
  ): ITiming {
    const s: readonly number[] = c.times;
    const coordinates: number[][] = s.map((_: number, k: number): number[] =>
      x.flatMap((arm: readonly (readonly number[])[]): number[] => [
        ...arm[k]!,
      ]),
    );
    const path: S.IDerivatives = S.derivatives(s, coordinates);

    // Each speed-bounded probe's place against its base at each instant, and
    // that place's path derivative.
    const probes: number[][] = s.map((): number[] => []);
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      const local: number[][][] = T.SPEED.map((): number[][] => []);
      s.forEach((_: number, k: number): void => {
        const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
        const placed: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
          c.setups[a]!,
          frame,
          arm[k]!,
          false,
        );
        T.SPEED.forEach((p: number, i: number): void => {
          const at: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(frame.parent.rotation),
            Vector3.subtract(placed.probes[p]![0], frame.parent.position),
          );
          local[i]!.push([at.x, at.y, at.z]);
        });
      });
      for (const course of local) {
        const rate: S.IDerivatives = S.derivatives(s, course);
        s.forEach((_: number, k: number): void => {
          probes[k]!.push(Math.hypot(...rate.velocities[k]!));
        });
      }
    });

    const parametrization: TOPP.IResult = TOPP.parametrize({
      path: {
        gridpoints: s,
        first: path.velocities,
        second: path.accelerations,
      },
      velocities: [
        {
          first: path.velocities,
          lower: s.map((): number[] =>
            coordinates[0]!.map((_: number, i: number): number => -rate(i)),
          ),
          upper: s.map((): number[] =>
            coordinates[0]!.map((_: number, i: number): number => rate(i)),
          ),
        },
        {
          first: probes,
          lower: s.map((t: number, k: number): number[] =>
            probes[k]!.map((): number => -c.speed(t)),
          ),
          upper: s.map((t: number, k: number): number[] =>
            probes[k]!.map((): number => c.speed(t)),
          ),
        },
      ],
      accelerations: [
        {
          lower: coordinates[0]!.map(
            (_: number, i: number): number =>
              -ACCELERATIONS[i % G.DIMENSIONS]!,
          ),
          upper: coordinates[0]!.map(
            (_: number, i: number): number =>
              ACCELERATIONS[i % G.DIMENSIONS]!,
          ),
        },
      ],
      start: 0,
      end: 0,
    });
    return {
      status: parametrization.status,
      timed: TOPP.timed(s, parametrization.parametrization),
    };
  }

  /**
   * A course retimed onto a span no shorter than its least: the time map slowed
   * uniformly to the span (Hollerbach 1984, every rate divided by the span's
   * ratio to the least, so every limit still holds), read at the context's own
   * instants on the course's path (`ConstAccel::evalParams`).
   *
   * @param c The context at the course's instants.
   * @param x Each arm's coordinates at each instant.
   * @param timed The course's time map (`timing`).
   * @param span The span to fill, seconds.
   * @returns Each arm's coordinates at each of the context's instants.
   */
  export function retimed(
    c: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
    timed: TOPP.ITimed,
    span: number,
  ): number[][][] {
    const s: readonly number[] = c.times;
    const least: number = timed.times[timed.times.length - 1]!;
    const ratio: number = least / span;
    // The slowed map runs in order. One traversal finds the times every arm
    // will sample, after the scale t' = (t - s0) · ratio.
    let interval: number = 0;
    const at: number[] = s.map((t: number): number => {
      const tau: number = (t - s[0]!) * ratio;
      while (
        interval + 2 < timed.times.length &&
        timed.times[interval + 1]! <= tau
      )
        ++interval;
      const dt: number = tau - timed.times[interval]!;
      return (
        s[interval]! +
        dt * timed.velocities[interval]! +
        0.5 * dt * dt * timed.accelerations[interval]!
      );
    });
    return x.map((arm: readonly (readonly number[])[]): number[][] => {
      const path: S.IDerivatives = S.derivatives(s, arm);
      const positions: (seconds: number) => Knots.IPosition = Knots.positions(
        s,
        arm,
        path.velocities,
        path.accelerations,
      );
      return at.map((seconds: number): number[] => positions(seconds).coordinates);
    });
  }

  /** A course's timing. */
  export interface ITiming {
    /** How TOPP-RA ended. */
    status: TOPP.Status;

    /** Its time map. */
    timed: TOPP.ITimed;
  }
}

/** A coordinate's velocity limit, the arm's table read by coordinate. */
function rate(i: number): number {
  return RATES[i % G.DIMENSIONS]!;
}
