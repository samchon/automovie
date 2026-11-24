import { HumanArmConnect } from "./HumanArmConnect";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The arms' coordinate space of a seed (`HumanArmSeed`): OMPL's bounds of each
 * coordinate the sampling planner draws within, the arms' coordinates split
 * from a concatenation, and a path read at a share of its time coordinate.
 */
export namespace HumanArmSeedSpace {
  /** The arms' coordinate space: OMPL's bounds of each coordinate. */
  export interface ISpace {
    /** Each coordinate's least value, the arms' coordinates concatenated. */
    low: number[];

    /** Each coordinate's greatest value. */
    high: number[];
  }

  /** A coordinate's hard range, as the context holds it. */
  export type Bound = M.IContext["bounds"][number][number];

  /**
   * The arms' coordinates as OMPL's real vector space bounds them
   * (`RealVectorBounds`), which its sampler draws uniformly within
   * (`RealVectorStateSampler::sampleUniform`): the shoulder chart's two over
   * the box about its disc, [-R, R] each, the disc itself left to the validity
   * reading; every other free coordinate over its range; every fixed coordinate
   * at its rest value.
   */
  export function sampler(c: M.IContext): ISpace {
    const low: number[] = [];
    const high: number[] = [];
    const radii: number[] = c.rest.map((rest: number[], a: number): number =>
      Math.max(
        G.SCALE,
        Math.hypot(rest[0]!, rest[1]!),
        Math.hypot(c.back[a]![0]!, c.back[a]![1]!),
      ),
    );
    c.rest.forEach((rest: number[], a: number): void => {
      const radius: number = radii[a]!;
      rest.forEach((v: number, d: number): void => {
        const bound: Bound = c.bounds[a]![d] ?? null;
        if (!c.free[a]!.includes(d)) {
          low.push(v);
          high.push(v);
        } else if (d < 2) {
          low.push(-radius);
          high.push(radius);
        } else if (bound !== null) {
          low.push(bound[0]);
          high.push(bound[1]);
        } else {
          low.push(v);
          high.push(v);
        }
      });
    });
    return { low, high };
  }
  /** Each arm's coordinates from a concatenation. */
  export function split(q: readonly number[]): number[][] {
    const out: number[][] = [];
    for (let i: number = 0; i < q.length; i += G.DIMENSIONS)
      out.push(q.slice(i, i + G.DIMENSIONS));
    return out;
  }

  /**
   * The configuration of a path, without its share coordinate, where its share
   * (its last coordinate, rising along it) reaches a value.
   */
  export function at(
    path: readonly (readonly number[])[],
    share: number,
  ): number[] {
    const s: (q: readonly number[]) => number = (
      q: readonly number[],
    ): number => q[q.length - 1]!;
    for (let i: number = 1; i < path.length; ++i)
      if (share <= s(path[i]!) || i === path.length - 1) {
        const piece: number = s(path[i]!) - s(path[i - 1]!);
        return HumanArmConnect.lerp(
          path[i - 1]!,
          path[i]!,
          piece > 0
            ? Math.min(1, Math.max(0, (share - s(path[i - 1]!)) / piece))
            : 1,
        ).slice(0, -1);
      }
    return path[0]!.slice(0, -1);
  }
}
