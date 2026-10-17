import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import type { generatePelvisOwnedFamily } from "../family/generatePelvisOwnedFamily";

/** Admit the actual placed lower sections before returning any public ports.
 * Strict root-chart X separation is a deliberately sufficient supported domain,
 * not a universal intersection test. Z-separated but X-overlapping placements
 * are outside this contract. No physical dimension or parent is modified.
 *
 * @author Samchon
 */
export function assertActualPantsSeparation64(
  family: ReturnType<typeof generatePelvisOwnedFamily>,
): {
  /** Actual placed native-root chart used by these observations. */
  coordinateAuthority: string;

  /** Three physical generating station observations; not a continuous-height intersection theorem. */
  levels: {
    name: string;

    /** Station height in the native construction chart, millimetres. */
    heightMm: number;

    /** Minimum evaluated left cubic X, millimetres. */
    leftMinimumX: number;

    /** Maximum evaluated right cubic X, millimetres. */
    rightMaximumX: number;

    /** Left minimum minus right maximum X; strictly positive in the supported domain. */
    gapMm: number;
  }[];
} {
  const extent: (spans: M.Span[]) => [number, number] = (
    spans: M.Span[],
  ): [number, number] => {
    const values: number[] = [];
    for (const span of spans) {
      const p: number[] = span.map((v: M.V): number => v[0]);
      const a: number = -p[0]! + 3 * p[1]! - 3 * p[2]! + p[3]!,
        b: number = 2 * (p[0]! - 2 * p[1]! + p[2]!),
        c: number = p[1]! - p[0]!;
      const discriminant: number = b * b - 4 * a * c;
      const roots: number[] =
        a === 0
          ? b === 0
            ? []
            : [-c / b]
          : discriminant < 0
            ? []
            : [
                (-b + Math.sqrt(discriminant)) / (2 * a),
                (-b - Math.sqrt(discriminant)) / (2 * a),
              ];
      values.push(
        p[0]!,
        p[3]!,
        ...roots
          .filter((t: number): boolean => t > 0 && t < 1)
          .map((t: number): number => M.cubic(span, t)[0]),
      );
    }
    if (!values.every(Number.isFinite))
      throw new Error("Unresolved actual placed cubic section extrema");
    return [Math.min(...values), Math.max(...values)];
  };
  const left: typeof family.paired.left = family.paired.left,
    right: typeof family.paired.right = family.paired.right;
  if (
    left.ys.length !== right.ys.length ||
    left.ys.some((y: number, i: number): boolean => y !== right.ys[i])
  )
    throw new Error("One positive common roof height domain is required");
  const levels: {
    /** Generating station label, not a clinical landmark. */
    name: string;

    /** Station height in the native construction chart, millimetres. */
    heightMm: number;

    /** Minimum evaluated left cubic X, millimetres. */
    leftMinimumX: number;

    /** Maximum evaluated right cubic X, millimetres. */
    rightMaximumX: number;

    /** Left minimum minus right maximum X; strictly positive in the supported domain. */
    gapMm: number;
  }[] = left.ys.map(
    (
      heightMm: number,
      i: number,
    ): ReturnType<typeof assertActualPantsSeparation64>["levels"][number] => {
      const leftMinimumX: number = extent(left.controls(heightMm))[0],
        rightMaximumX: number = extent(right.controls(heightMm))[1];
      return {
        name:
          i === 0
            ? "midpointTube"
            : i === left.ys.length - 1
              ? "nearChart"
              : "intermediateLowerChart",
        heightMm,
        leftMinimumX,
        rightMaximumX,
        gapMm: leftMinimumX - rightMaximumX,
      };
    },
  );
  if (
    levels.some((level: (typeof levels)[number]): boolean => !(level.gapMm > 0))
  )
    throw new Error(
      "Actual parent placement leaves the supported X-separated lower pants chart: " +
        JSON.stringify(levels),
    );
  return {
    coordinateAuthority:
      "Actual generated paired cubic extrema after side-parent placement in the native root chart; no nominal-skeleton clearance substitution",
    levels,
  };
}
