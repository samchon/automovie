import { AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicSection as Conic } from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  AutoMovieVector2Tuple as P,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

/** Independent starting conics for the section-owned skin above the trunk stock. */
export namespace FamilyConicMpfbUpperStock {
  /** Actual owned polyline pieces at one transverse plane, in world millimetres. */
  export interface ILevel {
    /** Superior position in the figure's world frame. */
    height: number;
    /**
     * Profile arcs from the smoothed public skin, preserving their open ends at
     * a port.
     */
    wall: Point[][];
    /** Number of intersections with the divided arm sectors. */
    crossings: number;
  }

  /**
   * Fit varying sagittal depth and lateral skin using one observed median per
   * quadrant.
   */
  export function derive(
    levels: readonly ILevel[],
    chart: Pick<IAutoMovieHumanConicLoft.IFamily, "centres" | "halves" | "up">,
  ) {
    const first: Point = chart.centres[0]!;
    const layout = Conic.bilateral(1);
    const sections = levels.map(({ height, wall, crossings }) => {
      const polylines: P[][] = wall.map((curve): P[] =>
        curve.map(([x, , z]): P => [x, z - first[2]]),
      );
      const chords: [P, P][] = polylines.flatMap((curve): [P, P][] =>
        (crossings === 0 ? curve : curve.slice(0, -1)).map((p, i): [P, P] => [
          p,
          curve[(i + 1) % curve.length]!,
        ]),
      );
      const roots: number[] = chords.flatMap(([a, b]): number[] => {
        if (a[1] > 0 === b[1] > 0) return [];
        return [a[0] + ((b[0] - a[0]) * a[1]) / (a[1] - b[1])];
      });
      if (roots.length < 2)
        throw new Error(`No measured sagittal depth at height ${height} mm`);
      const rear: number = Math.min(...roots),
        forward: number = Math.max(...roots);
      const centre: number = (rear + forward) / 2;
      const side: P = polylines
        .flat()
        .reduce((a, b): P => (b[1] > a[1] ? b : a));
      const p0: P = [forward, 0],
        p1: P = [side[0], side[1]],
        p2: P = [rear, 0];
      const tangents: P[] = [
        [0, 1],
        [-1, 0],
        [0, -1],
      ];
      const points: P[] = [p0, p1, p2];
      const controls: P[] = [p0];
      const directions: P[] = [tangents[0]!];
      const medians: number[] = [];
      for (let i: number = 0; i < 2; ++i) {
        const a: P = points[i]!,
          b: P = points[i + 1]!;
        const mid: P = half(a, b);
        const corner: P = meet(a, tangents[i]!, b, tangents[i + 1]!);
        const fraction: number = share(chords, mid, corner);
        medians.push(fraction);
        controls.push(advance(mid, sub(corner, mid), fraction), b);
        directions.push(sub(b, a), tangents[i + 1]!);
      }
      const bends: number[] = controls.slice(0, -1).map((p, i): number => {
        const q: P = controls[i + 1]!;
        return share(
          chords,
          half(p, q),
          meet(p, directions[i]!, q, directions[i + 1]!),
        );
      });
      const values: number[] = [
        forward - centre,
        medians[0]!,
        side[0] - centre,
        side[1],
        medians[1]!,
        rear - centre,
        ...bends,
      ];
      const outline = Conic.chain(values, layout);
      const visibleLength: number = chords.reduce(
        (sum, [a, b]): number => sum + Math.hypot(b[0] - a[0], b[1] - a[1]),
        0,
      );
      const errors: number[] = polylines.flat().map(([x, z]): number => {
        const radius: number = Math.hypot(x - centre, z);
        return Math.abs(
          AutoMovieViewChain.radius(outline, Math.atan2(z, x - centre)) -
            radius,
        );
      });
      return {
        height,
        centre,
        ap: forward - rear,
        breadth: 2 * side[1],
        visibleLength,
        girth: crossings === 0 ? visibleLength : undefined,
        values,
        fault: outline.fault,
        maximum: errors.every(Number.isFinite) ? Math.max(...errors) : null,
      };
    });
    const firstValid = sections[0]!;
    const family: IAutoMovieHumanConicLoft.IFamily = {
      ...chart,
      name: "hm08.trunk.upper.medians",
      layout,
      knots: sections.map(({ height }): number => height - first[1]),
      values: firstValid.values.map((_, i): number[] =>
        sections.map(({ values }): number => values[i]!),
      ),
      origin: {
        u: sections.map(({ centre }): number => centre - first[0]),
        v: sections.map((): number => 0),
      },
    };
    return { family, sections };
  }
}

function half(a: P, b: P): P {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function sub(a: P, b: P): P {
  return [a[0] - b[0], a[1] - b[1]];
}
function cross(a: P, b: P): number {
  return a[0] * b[1] - a[1] * b[0];
}
function advance(p: P, step: P, t: number): P {
  return [p[0] + t * step[0], p[1] + t * step[1]];
}
function meet(a: P, da: P, b: P, db: P): P {
  return advance(a, da, cross(sub(b, a), db) / cross(da, db));
}

/** First physical intersection of a measured chord-to-corner control ray. */
function share(chords: readonly [P, P][], a: P, b: P): number {
  const step: P = sub(b, a);
  let nearest: number = Infinity;
  for (const [p, q] of chords) {
    const direction: P = sub(q, p);
    const division: number = cross(step, direction);
    if (division === 0) continue;
    const offset: P = sub(p, a);
    const t: number = cross(offset, direction) / division;
    const fraction: number = cross(offset, step) / division;
    if (t > 0 && t < 1 && fraction >= 0 && fraction <= 1)
      nearest = Math.min(nearest, t);
  }
  // The rational quarter ellipse weighs its centre control by 1/sqrt(2), giving its chord-to-corner share sqrt(2)-1.
  return Number.isFinite(nearest) ? nearest : Math.SQRT2 - 1;
}
