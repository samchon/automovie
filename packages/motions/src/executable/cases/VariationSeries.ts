import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";

/**
 * What the variation capture's series of repeats share: the repeat count,
 * the spread ratio every series is held to, the stage a series is performed
 * on and the two spread measures.
 */
export namespace VariationSeries {
  /** Repeats per series. */
  export const REPEATS: number = 32;

  /** The least ratio of a spread at proficiency 0 to that at proficiency 1. */
  export const RATIO: number = 2;

  /** One performer, trained, at the origin facing +Z, and an optional partner a gap ahead facing back. */
  export function perform(
    body: IHumanBody,
    chain: HumanChain,
    partner?: { body: IHumanBody; gap: number },
  ): HumanPerformance {
    return new HumanPerformance({
      seed: "variation",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        ...(partner === undefined
          ? []
          : [
              {
                subject: "b",
                body: partner.body,
                at: { x: 0, y: 0, z: partner.gap },
                yaw: 180,
                proficiency: { level: "trained" as const },
              },
            ]),
      ],
      composition: chain.node,
    });
  }

  /** The root mean square distance of points from their mean, metres. */
  export function dispersion(points: IAutoMovieVector3[]): number {
    const mean: IAutoMovieVector3 = Vector3.scale(
      points.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / points.length,
    );
    return Math.sqrt(
      points.reduce(
        (sum: number, p: IAutoMovieVector3): number =>
          sum + Vector3.length(Vector3.subtract(p, mean)) ** 2,
        0,
      ) / points.length,
    );
  }

  /** The standard deviation of values. */
  export function deviation(values: number[]): number {
    const mean: number =
      values.reduce((sum: number, v: number): number => sum + v, 0) /
      values.length;
    return Math.sqrt(
      values.reduce(
        (sum: number, v: number): number => sum + (v - mean) ** 2,
        0,
      ) / values.length,
    );
  }
}
