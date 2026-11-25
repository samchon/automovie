import type {
  AutoMovieVector3Tuple,
  IAutoMovieBlendColumn,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidBlendChain,
  IAutoMovieSolidJoin,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidBlend } from "./AutoMovieSolidBlend";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { prepareAutoMovieSolidExactRailBoundary } from "./prepareAutoMovieSolidExactRailBoundary";

type Point = AutoMovieVector3Tuple;

/** Tessellate the original pair of source rails and their exact cross ribbons. */
export namespace AutoMovieSolidExactBlend {
  const TURN = 2 * Math.PI;

  /** Prepare each closed rail in the owning chart with its admitted anchors. */
  export function prepare(
    join: IAutoMovieSolidJoin.IJoin,
    blend: IAutoMovieSolidBlendChain.IBlend,
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    exactBoundaries: boolean = false,
  ) {
    const anchors = blend.rails;
    if (
      anchors === undefined ||
      anchors.length === 0 ||
      join.curve.winding !== 0 ||
      join.curve.partWinding !== 0 ||
      !positive(1 / (blend.length * blend.length))
    )
      return null;
    const face = anchors[0]!.hostFace;
    if (anchors.some((rail) => rail.hostFace !== face)) return null;
    const parent = host.faces[face];
    if (parent === undefined) return null;
    const line = (
      surface: IAutoMovieSolidSurface,
      chart: [number, number][],
      directions: [number, number][],
    ) => {
      const count = chart.length;
      const period = surface.period;
      if (
        count !== anchors.length ||
        (period !== undefined && !positive(period)) ||
        directions.length !== count
      )
        return null;
      const positions: [number, number][] = [];
      for (const [u, v] of chart) {
        const before = positions.at(-1)?.[1];
        const phase =
          before === undefined
            ? v
            : AutoMovieSolidCycle.shift(v, before, period);
        if (
          !AutoMovieSolidDomain.contains(surface, u, phase) ||
          (before !== undefined &&
            period !== undefined &&
            Math.abs(phase - before) >= period / 2)
        )
          return null;
        positions.push([u, phase]);
      }
      // A periodic interpolation needs a single lifted, zero-winding circuit.
      if (
        period !== undefined &&
        Math.abs(positions[0]![1] - positions.at(-1)![1]) >= period / 2
      )
        return null;
      const points = AutoMovieSplineCurve.interpolate(positions);
      const across = AutoMovieSplineCurve.interpolate(directions);
      const boundary = exactBoundaries
        ? prepareAutoMovieSolidExactRailBoundary(points, positions, period)
        : undefined;
      if (boundary === null) return null;
      const read = (phase: number) => {
        const [u, v] = AutoMovieSplineCurve.evaluate(points, count, phase);
        const [du, dv] = AutoMovieSplineCurve.evaluate(across, count, phase);
        return {
          chart: [u, v] as [number, number],
          across: [du, dv] as [number, number],
        };
      };
      return { read, boundary };
    };
    const parentLine = line(parent, blend.host.chart, blend.across);
    const partLine = line(part, blend.part.chart, blend.partAcross);
    if (parentLine === null || partLine === null) return null;
    const at = (phase: number) => {
      const h = parentLine.read(phase);
      const a = partLine.read(phase);
      const b = AutoMovieSolidDomain.jet(parent, ...h.chart);
      const p = AutoMovieSolidDomain.jet(part, ...a.chart);
      if (b === null || p === null) return null;
      if (![b, p].every(({ u, v }) => positive(Vec.norm(Vec.cross(u, v)))))
        return null;
      const chord = Vec.norm(Vec.sub(p.p, b.p));
      const speed = (j: IAutoMovieSolidSurface.IJet, d: [number, number]) =>
        Vec.norm(
          Vec.combine([
            [d[0], j.u],
            [d[1], j.v],
          ]),
        );
      const hostScale = chord / speed(b, h.across);
      const partScale = chord / speed(p, a.across);
      if (!(positive(hostScale) && positive(partScale))) return null;
      const start = AutoMovieSolidRibbon.fromJet(
        b,
        -h.across[0],
        -h.across[1],
        hostScale,
      );
      const end = AutoMovieSolidRibbon.fromJet(
        p,
        a.across[0],
        a.across[1],
        partScale,
      );
      if (
        ![start, end].every(
          ({ first, second }) =>
            positive(Vec.norm(first)) && second.every(Number.isFinite),
        )
      )
        return null;
      return { h, a, b, p, start, end };
    };
    const column: IAutoMovieSolidJoin.IJoin["column"] = (t) => {
      const curve = join.curve.at(t);
      if (curve === null) return null;
      const sample = at(t - blend.seed);
      if (sample === null) return null;
      const { h, a, b, p, start, end } = sample;
      return {
        start,
        end,
        outward: Vec.scale(Vec.cross(b.u, b.v), parent.orientation),
        rail: {
          curve,
          s: a.chart[0],
          phi: a.chart[1],
          sigma: a.across[0] > 0 ? 1 : -1,
          partAcross: a.across,
          partPoint: p.p,
          hostFace: face,
          host: h.chart,
          across: h.across,
          hostPoint: b.p,
        },
      };
    };
    const boundaries =
      parentLine.boundary === undefined || partLine.boundary === undefined
        ? undefined
        : {
            host: { ...parentLine.boundary, at: parentLine.read },
            part: { ...partLine.boundary, at: partLine.read },
          };
    return { at, column, boundaries };
  }

  /** Select one angular partition for both rails and the adjoining ribbon. */
  export function adaptive(
    read: (phase: number) => IAutoMovieBlendColumn | null,
    count: number,
    rows: number,
    chord: number,
  ): { phases: number[]; rows: number } | string {
    if (!positive(chord))
      return "the rail deflection must be positive and finite";
    const maxArrayLength = 2 ** 32 - 1;
    if (!Number.isInteger(rows) || rows < 1 || 2 * rows + 1 > maxArrayLength)
      return "the transverse probe count is not representable";
    const phases: number[] = [];
    let transverse = 0;
    const ribbon = (phase: number): Point[] | null => {
      const column = read(phase);
      if (column === null) return null;
      const points = Array.from(
        { length: 2 * rows + 1 },
        (_, k) =>
          AutoMovieSolidBlend.jet(column.start, column.end, k / (2 * rows))
            .point,
      );
      for (let k = 1; k < 2 * rows; k += 2)
        transverse = Math.max(
          transverse,
          sagitta(points[k - 1]!, points[k]!, points[k + 1]!),
        );
      return points;
    };
    const refine = (
      a: number,
      pa: Point[],
      b: number,
      pb: Point[],
    ): boolean => {
      const m = (a + b) / 2;
      if (!(m > a && m < b)) return false;
      const pm = ribbon(m);
      if (pm === null) return false;
      const error = pm.reduce(
        (max, p, k) => Math.max(max, sagitta(pa[k]!, p, pb[k]!)),
        0,
      );
      if (!Number.isFinite(error)) return false;
      if (error <= chord) {
        phases.push(a);
        return true;
      }
      return refine(a, pa, m, pm) && refine(m, pm, b, pb);
    };
    const first = ribbon(0);
    if (first === null) return "the first native ribbon is unavailable";
    const coordinateScale = first.reduce(
      (max, p) => Math.max(max, Vec.norm(p)),
      0,
    );
    if (
      !Number.isFinite(coordinateScale) ||
      chord < Number.EPSILON * coordinateScale
    )
      return "the rail deflection is below the precision of its world coordinates";
    let a = 0;
    let previous = first;
    for (let k = 1; k <= count; k++) {
      const b = (TURN * k) / count;
      const next = k === count ? first : ribbon(b);
      if (next === null || !refine(a, previous, b, next))
        return "native ribbon subdivision has no finite geometric resolution";
      a = b;
      previous = next;
    }
    const transverseRows = Math.ceil(
      rows * Math.max(1, Math.sqrt(transverse / chord)),
    );
    if (!(transverseRows < maxArrayLength))
      return "the transverse ribbon count is not representable";
    return { phases, rows: transverseRows };
  }

  /** Attach aligned native rail samples to the original loft metadata. */
  export function discretize(
    blend: IAutoMovieSolidBlendChain.IBlend,
    join: IAutoMovieSolidJoin.IJoin,
    column: IAutoMovieSolidJoin.IJoin["column"],
    phases: readonly number[],
  ): IAutoMovieSolidBlendChain.IBlend | null {
    const rails = [];
    const host: number[] = [];
    const part: (number | null)[] = [];
    for (const phase of phases) {
      const t = blend.seed + phase;
      const read = column(t);
      if (read === null) return null;
      rails.push(read.rail);
      const widths = join.widths(t);
      host.push(widths.host);
      part.push(widths.part);
    }
    return {
      ...blend,
      phases,
      rails,
      host: {
        ...blend.host,
        chart: rails.map((r) => r.host),
        faces: rails.map((r) => r.hostFace),
      },
      part: { ...blend.part, chart: rails.map((r) => [r.s, r.phi]) },
      across: rails.map((r) => r.across),
      partAcross: rails.map((r) => r.partAcross),
      curve: rails.map((r) => r.curve.point),
      widths: { host, part },
    };
  }

  /**
   * Retain the native value and transverse two-jet at every phase. Prepare a
   * column once per evaluated phase before reading its station samples.
   */
  export function surface(
    read: (phase: number) => IAutoMovieBlendColumn | null,
    name: string,
    length: number,
    orientation: 1 | -1,
  ): IAutoMovieSolidSurface {
    const exact = (phase: number) => {
      const wrapped =
        phase >= 0 && phase < TURN ? phase : ((phase % TURN) + TURN) % TURN;
      const column = read(wrapped);
      if (column === null)
        throw new AutoMovieLoftAdmissionError(
          `Native blend ${name} has no regular ribbon at phase ${phase}`,
        );
      return (station: number) =>
        AutoMovieSolidBlend.jet(column.start, column.end, station / length);
    };
    // ESTIMATE. The fourth root balances binary64 cancellation against the
    // second-order central difference for the angular second derivative.
    const h = Math.sqrt(Math.sqrt(Number.EPSILON));
    const jetAlong = (phase: number) => {
      const left = exact(phase - h);
      const at = exact(phase);
      const right = exact(phase + h);
      return (station: number): IAutoMovieSolidSurface.IJet => {
        const l = left(station);
        const m = at(station);
        const r = right(station);
        return {
          p: m.point,
          u: Vec.scale(m.first, 1 / length),
          v: Vec.scale(Vec.sub(r.point, l.point), 1 / (2 * h)),
          uu: Vec.scale(m.second, 1 / (length * length)),
          uv: Vec.scale(Vec.sub(r.first, l.first), 1 / (2 * h * length)),
          vv: Vec.scale(
            Vec.add(Vec.sub(r.point, m.point), Vec.sub(l.point, m.point)),
            1 / (h * h),
          ),
        };
      };
    };
    const pointAlong = (phase: number) => {
      const read = exact(phase);
      return (station: number): Point => read(station).point;
    };
    return {
      name,
      period: TURN,
      domain: [0, length],
      orientation,
      jet: (u, v) => jetAlong(v)(u),
      jetAlong,
      point: (u, v) => pointAlong(v)(u),
      pointAlong,
    };
  }

  /** Midpoint departure from the straight chord in millimetres. */
  function sagitta(a: Point, p: Point, b: Point): number {
    return Vec.norm(Vec.sub(Vec.sub(p, a), Vec.scale(Vec.sub(b, a), 0.5)));
  }

  /** A representable positive geometric magnitude. */
  function positive(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }
}
