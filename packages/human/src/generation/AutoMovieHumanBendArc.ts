import { AutoMovieConstructionViews } from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "./AutoMovieHumanConstructionView";

/** Convert a geometric bend-radius condition into the engine's jointed-axis half arclength. */
export namespace AutoMovieHumanBendArc {
  /**
   * Half arclength whose peak curvature is `1/radius` for the engine's
   * quintic smoothstep angle law: kappa=theta*S'(t)/(2h), max S'=15/8,
   * hence h=15*radius*theta/16. A straight joint has no turn or set-back.
   * This is a geometric construction convention, not an anatomical coefficient.
   *
   * @evidence contracts/common.md#principled-implementation Derives arclength from the declared minimum bend radius and actual angle using the engine's documented quintic angle law.
   * @evidence contracts/common.md#clear-and-simple-design One conversion keeps a radius distinct from a turn's half arclength.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No fitted multiplier, segment shortening or per-person adjustment admits an otherwise invalid course.
   * @evidence contracts/common.md#meaningful-documentation Gives the derivative maximum, equation, straight-joint case and evidence class.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-size vector arithmetic per joint.
   * @evidence contracts/performance.md#reuse-equivalent-work The same conversion serves fingers, thumbs and their shared walk.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar without retaining geometry.
   */
  export function half(
    before: readonly number[],
    joint: readonly number[],
    after: readonly number[],
    radius: number,
  ): number {
    const points: [number, number, number][] = [before, joint, after].map(
      (point: readonly number[]): [number, number, number] =>
        AutoMovieConstructionViews.point(
          AutoMovieHumanConstructionView.point(point),
        ),
    );
    const first: number[] = points[1]!.map(
      (value: number, index: number): number => value - points[0]![index]!,
    );
    const second: number[] = points[2]!.map(
      (value: number, index: number): number => value - points[1]![index]!,
    );
    const firstLength: number = Math.hypot(...first);
    const secondLength: number = Math.hypot(...second);
    if (!(firstLength > 0 && secondLength > 0 && radius > 0))
      throw new Error("A joint turn needs positive segments and radius");
    // Match the axis owner's unit-direction arithmetic: raw-vector cross
    // cancellation can otherwise call a tiny admitted turn exactly straight.
    const a: number[] = first.map(
      (value: number): number => value * (1 / firstLength),
    );
    const b: number[] = second.map(
      (value: number): number => value * (1 / secondLength),
    );
    const dot: number = a.reduce(
      (sum: number, value: number, index: number): number =>
        sum + value * b[index]!,
      0,
    );
    const cross: number[] = [
      a[1]! * b[2]! - a[2]! * b[1]!,
      a[2]! * b[0]! - a[0]! * b[2]!,
      a[0]! * b[1]! - a[1]! * b[0]!,
    ];
    const angle: number = Math.atan2(Math.hypot(...cross), dot);
    return (15 * radius * angle) / 16;
  }
}
