import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { ITorsoMeasurements as T } from "../family/ITorsoMeasurements";
import { TorsoFamily } from "../family/TorsoFamily";
import { TorsoMath as M } from "../family/TorsoMath";

/** Solve runtime section roundness against ideal taut convex tape, approximated by a 96-subdivision convex hull per cubic span. Breadth, depth and heights remain fixed. Shared angular widths couple the courses, so bounded coordinate passes rebuild and remeasure every final equation together. Missing brackets or failure after sixteen passes reject this lowering method, not the biological person. The 1e-7 mm stopping residual excludes sampling error and is not clinical accuracy. */
export function fitAutoMovieTorsoGirth64(
  rebuild: (powers: Readonly<Record<string, number>>) => T.Value,
  targets: Readonly<Record<string, number>>,
): {
  /** Resolved internal physical/ratio input to the actual torso factory, without sampled source geometry. */
  parameters: T.Value;

  /** Targets and measured sampled-hull lengths on the same final simultaneous family; no stale per-coordinate values are returned. */
  observations: readonly {
    /** Semantic section identity whose roundness is solved. */
    course: string;

    /** Requested ideal convex-tape circumference in millimetres. */
    targetMm: number;

    /** Perimeter in millimetres of the final emitted section's 96-subdivision sampled convex hull. */
    emittedLengthMm: number;

    /** Sampled-hull perimeter minus target in millimetres; it excludes curve-sampling approximation error. */
    residualMm: number;

    /** Positive common superellipse exponent solved at runtime for this course. */
    roundnessPower: number;

    /** Whether the finite exponent scan brackets the target in the supported curve family; returned successful observations are bracketed. */
    bracketed: boolean;
  }[];
} {
  let data: T.Value = rebuild({});
  const powers: Record<string, number> = {};
  const observations: {
    course: string;
    targetMm: number;
    emittedLengthMm: number;
    residualMm: number;
    roundnessPower: number;
    bracketed: boolean;
  }[] = [];
  const perimeter: (controls: readonly C.Span[]) => number = (
    controls: readonly C.Span[],
  ): number => {
    const p: [number, number][] = controls.flatMap(
      (span: C.Span): [number, number][] =>
        Array.from(
          { length: 97 },
          (_: unknown, i: number): [number, number] => {
            const q: C.Vector = M.bez(span, i / 96);
            return [q[0], q[2]];
          },
        ),
    );
    p.sort(
      (a: [number, number], b: [number, number]): number =>
        a[0] - b[0] || a[1] - b[1],
    );
    const cross: (
      a: [number, number],
      b: [number, number],
      c: [number, number],
    ) => number = (
      a: [number, number],
      b: [number, number],
      c: [number, number],
    ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const chain: (points: readonly [number, number][]) => [number, number][] = (
      points: readonly [number, number][],
    ): [number, number][] => {
      const hull: [number, number][] = [];
      for (const q of points) {
        while (hull.length > 1 && cross(hull.at(-2)!, hull.at(-1)!, q) <= 0)
          hull.pop();
        hull.push(q);
      }
      return hull;
    };
    const low: [number, number][] = chain(p);
    const high: [number, number][] = chain([...p].reverse());
    const hull: [number, number][] = [
      ...low.slice(0, -1),
      ...high.slice(0, -1),
    ];
    return hull.reduce(
      (sum: number, q: [number, number], i: number): number =>
        sum +
        Math.hypot(
          q[0] - hull[(i + 1) % hull.length]![0],
          q[1] - hull[(i + 1) % hull.length]![1],
        ),
      0,
    );
  };
  const entries: readonly [string, number][] = Object.entries(targets);
  // Angular widths are averages across all rows; solving one row changes all row handles.
  // Iterate the coupled equations, rather than reporting stale per-coordinate observations.
  let converged: boolean = false;
  let passes: number = 0;
  for (; passes < 16; passes++) {
    for (const [name, target] of entries) {
      if (!Number.isFinite(target) || target <= 0)
        throw new Error("Positive physical girth required");
      const y: number = data.sections[name]!.heightRatio * data.trunkLengthMm;
      const at: (gain: number) => number = (gain: number): number => {
        powers[name] = gain;
        data = rebuild(powers);
        return perimeter(
          new TorsoFamily(
            data,
            [0, 0, 0],
            [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ],
          ).controls(y),
        );
      };
      const grid: { gain: number; length: number }[] = Array.from(
        { length: 25 },
        (_: unknown, i: number): { gain: number; length: number } => {
          const gain: number = Math.pow(2, i / 3);
          return { gain, length: at(gain) };
        },
      );
      let best: { gain: number; length: number } = grid.reduce(
        (
          a: { gain: number; length: number },
          b: { gain: number; length: number },
        ): { gain: number; length: number } =>
          Math.abs(a.length - target) <= Math.abs(b.length - target) ? a : b,
      );
      const index: number = grid.findIndex(
        (a: { gain: number; length: number }, i: number): boolean =>
          i < grid.length - 1 &&
          (a.length - target) * (grid[i + 1]!.length - target) <= 0,
      );
      if (index >= 0) {
        let lo: number = grid[index]!.gain;
        let hi: number = grid[index + 1]!.gain;
        let loValue: number = grid[index]!.length - target;
        for (let iteration: number = 0; iteration < 48; iteration++) {
          const gain: number = (lo + hi) / 2;
          const value: number = at(gain);
          if (Math.abs(value - target) < Math.abs(best.length - target))
            best = { gain, length: value };
          if ((value - target) * loValue <= 0) hi = gain;
          else {
            lo = gain;
            loValue = value - target;
          }
        }
      }
      at(best.gain);
      if (index < 0)
        throw new Error(
          "Independent girth is outside the common section family: " + name,
        );
    }
    const finalFamily: TorsoFamily = new TorsoFamily(
      data,
      [0, 0, 0],
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    );
    observations.length = 0;
    for (const [name, target] of entries) {
      const value: number = perimeter(
        finalFamily.controls(
          data.sections[name]!.heightRatio * data.trunkLengthMm,
        ),
      );
      observations.push({
        course: name,
        targetMm: target,
        emittedLengthMm: value,
        residualMm: value - target,
        roundnessPower: powers[name]!,
        bracketed: true,
      });
    }
    if (
      observations.every(
        (o: (typeof observations)[number]): boolean =>
          Math.abs(o.residualMm) <= 1e-7,
      )
    ) {
      converged = true;
      break;
    }
  }
  if (!converged)
    throw new Error(
      "Coupled physical girth equations did not converge in 16 common passes",
    );
  return { parameters: data, observations };
}
