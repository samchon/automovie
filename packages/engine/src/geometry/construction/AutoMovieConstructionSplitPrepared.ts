import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBand,
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieConstructionSplitCourses as Courses } from "./AutoMovieConstructionSplitCourses";
import { AutoMovieConstructionSplitCubic as Cubic } from "./AutoMovieConstructionSplitCubic";
import { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** Publish indexed strip charts, surface readers and their exact source phases. */
export namespace AutoMovieConstructionSplitPrepared {
  const TURN = 2 * Math.PI;

  /** Prepare the curve-owned strips used by the shared fan incidence assembler. */
  export function prepare(
    input: Courses.IInput,
    names: readonly string[],
    terminal?: Exclude<ReturnType<typeof Courses.prepare>, string>,
  ) {
    const radial = input.radial === true;
    const shape = terminal ?? Courses.prepare(input, !radial);
    if (typeof shape === "string") return shape;
    const minimum = Math.max(
      2,
      ...shape.jets.flatMap(({ edges }) =>
        edges.map(({ count }, j): number =>
          Math.ceil(count / (edges.length === 2 && j === 0 ? 3 : 1)),
        ),
      ),
    );
    // The terminal medial curve carries its exact center as a shared vertex.
    const quarter =
      terminal === undefined ? minimum : 2 * Math.ceil(minimum / 2);
    const count = 4 * quarter;
    const bands = shape.jets.map(
      (
        { edges, ribbons, rows, evidence },
        i,
      ): IAutoMovieConstructionSplitBand.IPreparedStrip | string => {
        const band = names[i]!;
        if (
          !evidence.directed ||
          !(evidence.minimumSide > 0) ||
          (evidence.minimumRadius !== undefined &&
            !(evidence.minimumRadius > 0))
        )
          return `${band}: the native generating controls leave their permitted course`;
        if (!radial && ribbons?.length !== edges.length)
          return `${band}: the nonradial generating courses require shared ribbons`;
        const starts = edges.map((_, j): number =>
          edges.length === 4 || j === 0 ? j * quarter : 3 * quarter,
        );
        const step = TURN / count;
        const zero = () => (): P3 => [0, 0, 0];
        const stretches = edges.map((edge, j) => {
          const begin = starts[j]!;
          const width = (starts[j + 1] ?? count) - begin;
          return { edge, begin, width, ribbon: radial ? zero : ribbons![j]! };
        });
        // Seam columns keep the phase of the preceding original cut endpoint.
        const parentPhases = edges.map((edge, j) => {
          if (edge.bodyPhase !== undefined) return edge.bodyPhase;
          const adjacent =
            edges[(j + edges.length - 1) % edges.length]!.bodyPhase;
          if (adjacent === undefined) return undefined;
          const end = adjacent(1);
          return (): number => end;
        });
        if (parentPhases.some((read): boolean => read === undefined))
          return `${band}: a shared seam lacks an adjacent native cut sector`;
        const phases: number[] = [];
        const loops = stretches.flatMap(({ edge, width }, j) => {
          const parentPhase = parentPhases[j]!;
          return Array.from({ length: width }, (_, k) => {
            const v = k / width;
            phases.push(parentPhase(v));
            return edge.course(v);
          });
        });
        const childPhases = loops.map(({ phase }): number => phase);
        childPhases.forEach((p, k): void => {
          const previous = childPhases[k - 1];
          if (previous === undefined) return;
          const d = p - previous;
          childPhases[k] = previous + Math.atan2(Math.sin(d), Math.cos(d));
        });
        const columns: IAutoMovieBlendColumn[] = loops.map(
          ({ controls: c }) => ({
            start: { point: c[0], first: Cubic.first(c, 0), second: [0, 0, 0] },
            end: {
              point: c.at(-1)!,
              first: Cubic.first(c, 1),
              second: [0, 0, 0],
            },
          }),
        );
        const chart = (phase: number) => {
          const at = (((phase % TURN) + TURN) % TURN) / step;
          const index =
            at < starts[1]!
              ? 0
              : edges.length === 2
                ? 1
                : Math.min(3, Math.floor(at / quarter));
          const s = stretches[index]!;
          return { ...s, index, v: (at - s.begin) / s.width };
        };
        const anchor = chart(0);
        const next = anchor.edge.course(1 / anchor.width).controls[0];
        const native = input.parent.cut.jet(anchor.edge.bodyPhase!(0));
        const hostNormal = Vec.cross(native.u, native.v);
        const firstNormal = Vec.cross(
          columns[0]!.start.first,
          Vec.sub(next, native.p),
        );
        const orientation = Vec.dot(firstNormal, hostNormal) >= 0 ? 1 : -1;
        // The layer rows describe the chart's span and sampling to the legacy
        // consumers. The published strip below remains the one shape owner.
        const metadata = AutoMovieSolidBlendChain.strip(
          band,
          columns,
          Vec.scale(hostNormal, orientation),
          [],
          orientation,
        );
        if (metadata === null)
          return `${band}: cannot describe the native course span`;
        const { chain, length } = metadata;
        const line = (phase: number) => {
          const s = chart(phase);
          const controls = s.edge.course(s.v).controls;
          return (station: number): P3 => {
            const u = station / length;
            return Vec.add(Cubic.value(controls, u), s.ribbon(u)(s.v));
          };
        };
        const column = (phase: number) => {
          const s = chart(phase);
          const angular = stencil(s.v, s.width * step);
          const values = angular.offsets.map((offset) => s.v + offset);
          const controls = values.map((v) => s.edge.course(v).controls);
          const row = (u: number) => {
            const at = s.ribbon(u);
            return (j: number): P3 => Vec.add(Cubic.value(controls[j]!, u), at(values[j]!));
          };
          return { angular, row, offsets: values };
        };
        const jetAlong = (phase: number) => {
          const { angular, row, offsets } = column(phase);
          return (station: number): Solid.IJet => readJet(
            (u) => {
              const at = row(u);
              return offsets.map((_, j) => at(j));
            }, length, station / length, angular,
          );
        };
        const tangentAlong = (phase: number) => {
          const { angular, row, offsets } = column(phase);
          return (station: number): Solid.IFirst => {
            const u: number = station / length;
            const edges = stencil(u, length);
            const at = row(u);
            const cross = offsets.map((_, j) => at(j));
            const p = cross[0]!;
            const center = edges.offsets.map((offset, i) => i === 0 ? p : row(u + offset)(0));
            return { p, u: difference(center, edges.first), v: difference(cross, angular.first) };
          };
        };
        const surface: Solid = {
          name: band,
          domain: [0, length],
          period: TURN,
          orientation,
          point: (station, phase) => line(phase)(station),
          pointAlong: line,
          pointAt: (station) => {
            const u = station / length;
            const at = stretches.map(({ ribbon }) => ribbon(u));
            return (phase) => {
              const s = chart(phase);
              return Vec.add(
                Cubic.value(s.edge.course(s.v).controls, u),
                at[s.index]!(s.v),
              );
            };
          },
          jet: (station, phase) => jetAlong(phase)(station),
          jetAlong,
          tangentAlong,
        };
        return {
          chain,
          surface,
          length,
          stations: Array.from({ length: rows + 1 }, (_, j): number =>
            j === rows ? length : (j * length) / rows,
          ),
          loop: columns.map(({ start }) => start.point),
          phases,
          childPhases,
        };
      },
    );
    const refusals = bands.filter((b): b is string => typeof b === "string");
    return refusals.length === 0
      ? {
          count,
          rows: Math.max(...shape.jets.map(({ rows }) => rows)),
          bands: bands as IAutoMovieConstructionSplitBand.IPreparedStrip[],
        }
      : refusals.join("\n");
  }

  /**
   * ESTIMATE. Use centered three-point differences in the interior and a
   * one-sided four-point stencil at an owned boundary. The step balances
   * cancellation with second-order truncation inside the same curve sector.
   * https://doi.org/10.1090/S0025-5718-1988-0935077-0
   */
  function stencil(t: number, extent: number) {
    const step = Math.sqrt(Math.sqrt(Number.EPSILON));
    const sign = t > 1 - step ? -1 : 1;
    const h = extent * step;
    return t >= step && t <= 1 - step
      ? {
          offsets: [0, -step, step],
          first: [0, -0.5 / h, 0.5 / h],
          second: [-2 / h ** 2, 1 / h ** 2, 1 / h ** 2],
        }
      : {
          offsets: [0, sign * step, 2 * sign * step, 3 * sign * step],
          first: [(-1.5 * sign) / h, (2 * sign) / h, (-0.5 * sign) / h, 0],
          second: [2 / h ** 2, -5 / h ** 2, 4 / h ** 2, -1 / h ** 2],
        };
  }

  /** Read derivatives of a single prepared angular stencil. */
  function readJet(
    point: (course: number) => readonly P3[],
    length: number,
    u: number,
    angular: ReturnType<typeof stencil>,
  ): Solid.IJet {
    const station = stencil(u, length);
    const points = station.offsets.map((x) => point(u + x));
    const center = points.map((p) => p[0]!);
    const cross = points.map((p) => difference(p, angular.first));
    return {
      p: center[0]!,
      u: difference(center, station.first),
      v: cross[0]!,
      uu: difference(center, station.second),
      uv: difference(cross, station.first),
      vv: difference(points[0]!, angular.second),
    };
  }

  /** Subtract the central sample before summing a finite difference. */
  function difference(p: readonly P3[], weights: readonly number[]): P3 {
    return Vec.combine(p.map((x, k): [number, P3] => [weights[k]!, Vec.sub(x, p[0]!) ]));
  }
}
