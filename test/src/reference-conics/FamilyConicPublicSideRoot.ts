import {
  AutoMovieSolidVector as V,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { FamilyConicFit as F } from "./FamilyConicFit";

type Jet = IAutoMovieSolidSurface.IJet;
type Phase = (phi: number) => (along: number) => Jet;

/**
 * Fit world meridians while preserving the two endpoint jets of the owning
 * chart.
 */
export namespace FamilyConicPublicSideRoot {
  /**
   * A clean sampled wall, in mm, over the same directed angular chart as its
   * source.
   */
  export interface IInput {
    /** Prepare the existing analytic chart for one angular phase. */
    phase: Phase;
    /**
     * Independent observed material at unit arclength coordinate and angular
     * phase.
     */
    observe: (phi: number) => (along: number) => Point;
    /** The two unit directions that spell the child chart's polar ray. */
    axes: [Point, Point];
    /** Angular and longitudinal sample counts for the fit. */
    samples: [columns: number, intervals: number];
  }

  /** The exact fitted chart and a reproducible record of its active controls. */
  export interface IResult {
    /** Constant, first cosine and first sine offset amplitudes, mm. */
    values: Point;
    /** The chart with the same seam and protected endpoint jets. */
    phase: Phase;
    /** Initial and final mean squared source residual, mm squared. */
    meanSquare: [before: number, after: number];
    /**
     * Maximum world position, first-jet and second-jet changes at either
     * endpoint.
     */
    endpointError: [point: number, first: number, second: number];
    /** Accepted solver update count. */
    iterations: number;
    /** The common solver's terminal reason. */
    stopped: string;
  }

  /** The same angular chart on the original conic beyond the protected ring. */
  export interface IDistal {
    /** The protected station followed by the retained conic stations, in mm. */
    stations: readonly number[];
    /** Prepare the actual independent conic at one fixed phase. */
    phase: (phi: number) => (station: number) => Jet;
  }

  /**
   * Continue at the outlet's physical row pitch and grade into the original
   * distal spacing without moving an original station. Halving the first
   * interval from its near end keeps the ratio across new grading edges at
   * two or less. The physical field itself is unchanged.
   */
  export function gradedStations(
    stations: readonly number[],
    outletPitch: number,
  ): number[] {
    const from: number = stations[0]!;
    const next: number = stations[1]!;
    const span: number = next - from;
    if (!(span > 0 && outletPitch > 0))
      throw new Error("The protected section needs positive adjacent pitches");
    const depth: number = Math.max(0, Math.ceil(Math.log2(span / outletPitch)));
    const graded: number[] = Array.from(
      { length: depth },
      (_, k): number => from + span / 2 ** (depth - k),
    );
    return [from, ...graded, ...stations.slice(1)];
  }

  /**
   * The first angular harmonic gives a single coupled variation instead of an
   * independent motion on every meridian. The unit longitudinal bump is `64
   * t³(1-t)³`, the lowest-degree nonzero polynomial with two zero endpoint
   * jets, normalized to one at its midpoint. Its derivative and the polar ray's
   * derivatives enter the chart analytically. Exact sample orientation is a
   * hard premise of every solver reading.
   */
  export function fit(input: IInput, log?: (event: object) => void): IResult {
    const [columns, intervals] = input.samples;
    if (
      !Number.isSafeInteger(columns) ||
      columns < 4 ||
      !Number.isSafeInteger(intervals) ||
      intervals < 2
    )
      throw new Error(
        "The side-root fit needs a directed periodic chart and an interior station",
      );
    const sites = Array.from({ length: columns }, (_, i) => {
      const phi: number = (2 * Math.PI * i) / columns;
      const read = input.phase(phi);
      const observe = input.observe(phi);
      return Array.from({ length: intervals + 1 }, (_, row) => {
        const along: number = row / intervals;
        const base: Jet = read(along);
        const n: Point | null = V.unit(V.cross(base.u, base.v));
        const own: Point = observe(along);
        if (n === null || !own.every(Number.isFinite))
          throw new Error(
            "The public side-root chart has a singular source sample",
          );
        return {
          along,
          base,
          normal: n,
          own,
          controls: controls(input.axes, phi, along),
        };
      });
    }).flat();
    const weight: number = 1 / Math.sqrt(sites.length);
    const read = (point: readonly number[], derivatives: boolean) =>
      F.readGroup(point, derivatives, [
        {
          rows: () => {
            const measured: F.IGroupRow[] = [],
              hard: F.IGroupRow[] = [];
            for (const { base, normal, own, controls } of sites) {
              const jet = add(base, controls, point);
              const error: Point = V.sub(jet.p, own);
              for (const k of [0, 1, 2] as const)
                measured.push({
                  value: weight * error[k],
                  gradient: new Map(
                    derivatives
                      ? controls.map((control, i): [number, number] => [
                          i,
                          weight * control.p[k],
                        ])
                      : [],
                  ),
                });
              const area: number = V.dot(V.cross(jet.u, jet.v), normal);
              if (!(area > 0))
                return "a side-root trial reverses the source chart's orientation";
              hard.push({
                value: -area,
                gradient: new Map(
                  derivatives
                    ? controls.map((c, i): [number, number] => [
                        i,
                        -V.dot(
                          V.add(V.cross(c.u, jet.v), V.cross(jet.u, c.v)),
                          normal,
                        ),
                      ])
                    : [],
                ),
              });
            }
            return { measured, incidence: [], inside: [], hard };
          },
        },
      ]);
    const zero: Point = [0, 0, 0];
    const initial = read(zero, false);
    if (typeof initial === "string") throw new Error(initial);
    // A linear three-column position objective needs one Gauss–Newton step
    // without active bounds. Leave the common solver its three retained directions.
    const result = F.fitGroup(zero, read, 0.001, 3, log);
    if (typeof result === "string") throw new Error(result);
    const values: Point = [
      result.values[0]!,
      result.values[1]!,
      result.values[2]!,
    ];
    const endpointError: [number, number, number] = [0, 0, 0];
    for (const site of sites) {
      if (site.along !== 0 && site.along !== 1) continue;
      const fitted: Jet = add(site.base, site.controls, values);
      const difference = (key: keyof Jet): number =>
        V.norm(V.sub(fitted[key], site.base[key]));
      endpointError[0] = Math.max(endpointError[0], difference("p"));
      endpointError[1] = Math.max(
        endpointError[1],
        difference("u"),
        difference("v"),
      );
      endpointError[2] = Math.max(
        endpointError[2],
        difference("uu"),
        difference("uv"),
        difference("vv"),
      );
    }
    return {
      values,
      phase: apply(input.phase, input.axes, values),
      meanSquare: [initial.objective, result.objective],
      endpointError,
      iterations: result.iteration,
      stopped: result.stopped,
    };
  }

  /**
   * Reconstruct a fitted chart from its three stored amplitudes and original
   * source.
   */
  export function apply(
    phase: Phase,
    axes: [Point, Point],
    values: Point,
  ): Phase {
    return (phi: number) => {
      const read = phase(phi);
      return (along: number): Jet =>
        add(read(along), controls(axes, phi, along), values);
    };
  }

  /**
   * Sample the analytic candidate for matched views and independent
   * self-crossing verification.
   */
  export function emit(
    phase: Phase,
    columns: number,
    intervals: number,
    distal?: IDistal,
  ): {
    mesh: IAutoMovieMesh;
    crossingWitnesses: number;
    distalGap: number;
    distalNormalGap: number;
    distalCurvatureGap: [number, number, number];
    verticesPerColumn: number;
  } {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    let distalGap: number = 0;
    let distalNormalGap: number = 0;
    const distalCurvatureGap: [number, number, number] = [0, 0, 0];
    const distalRows: number =
      distal === undefined ? 0 : distal.stations.length - 1;
    if (distalRows < 0)
      throw new Error("The public distal chart needs its protected station");
    const rows: number = intervals + distalRows;
    const stride: number = rows + 1;
    for (let i: number = 0; i < columns; ++i) {
      const phi: number = (2 * Math.PI * i) / columns;
      const read = phase(phi);
      const retained = distal?.phase(phi);
      if (distal !== undefined && retained !== undefined) {
        const root: Jet = read(1);
        const stock: Jet = retained(distal.stations[0]!);
        distalGap = Math.max(
          distalGap,
          V.norm(V.sub(root.p, stock.p)),
        );
        const a = curvature(root);
        const b = curvature(stock);
        distalNormalGap = Math.max(
          distalNormalGap,
          Math.atan2(V.norm(V.cross(a.normal, b.normal)), V.dot(a.normal, b.normal)),
        );
        for (const k of [0, 1, 2] as const)
          distalCurvatureGap[k] = Math.max(
            distalCurvatureGap[k],
            Math.abs(a.rates[k] - b.rates[k]),
          );
      }
      for (let j: number = 0; j <= rows; ++j) {
        const jet: Jet =
          j <= intervals
            ? read(j / intervals)
            : retained!(distal!.stations[j - intervals]!);
        const normal: Point | null = V.unit(V.cross(jet.u, jet.v));
        if (normal === null)
          throw new Error("The emitted side-root chart is singular");
        positions.push(...jet.p.map((x): number => x / 1000));
        normals.push(...normal);
        if (j === rows) continue;
        const a: number = i * stride + j,
          b: number = ((i + 1) % columns) * stride + j;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const mesh: IAutoMovieMesh = {
      positions,
      indices,
      normals,
      uvs: null,
      skin: null,
    };
    return {
      mesh,
      crossingWitnesses: measureAutoMovieMeshCrossings(mesh, mesh, {
        allPairs: true,
      }).length,
      distalGap,
      distalNormalGap,
      distalCurvatureGap,
      verticesPerColumn: stride,
    };
  }
}

/** Surface normal and (longitudinal, mixed, angular) curvature in inverse mm. */
function curvature(jet: Jet): { normal: Point; rates: Point } {
  const normal: Point | null = V.unit(V.cross(jet.u, jet.v));
  if (normal === null) throw new Error("A protected outlet's curvature is singular");
  const u: number = V.norm(jet.u), v: number = V.norm(jet.v);
  return {
    normal,
    rates: [
      V.dot(normal, jet.uu) / (u * u),
      V.dot(normal, jet.uv) / (u * v),
      V.dot(normal, jet.vv) / (v * v),
    ],
  };
}

/**
 * Analytic endpoint-pinned displacement jets for the constant and first
 * harmonic.
 */
function controls([u, v]: [Point, Point], phi: number, t: number): Jet[] {
  const c: number = Math.cos(phi),
    s: number = Math.sin(phi),
    x: number = t * (1 - t);
  const radial: Point = V.combine([
      [c, u],
      [s, v],
    ]),
    tangent: Point = V.combine([
      [-s, u],
      [c, v],
    ]);
  const b: number = 64 * x ** 3;
  const db: number = 192 * x * x * (1 - 2 * t);
  const ddb: number = 384 * x * ((1 - 2 * t) ** 2 - x);
  const terms: [number, number, number][] = [
    [1, 0, 0],
    [c, -s, -c],
    [s, c, -s],
  ];
  return terms.map(([h, dh, ddh]): Jet => {
    const ray: Point = V.scale(radial, h);
    const d: Point = V.combine([
      [dh, radial],
      [h, tangent],
    ]);
    const dd: Point = V.combine([
      [ddh - h, radial],
      [2 * dh, tangent],
    ]);
    return {
      p: V.scale(ray, b),
      u: V.scale(ray, db),
      v: V.scale(d, b),
      uu: V.scale(ray, ddb),
      uv: V.scale(d, db),
      vv: V.scale(dd, b),
    };
  });
}

function add(
  base: Jet,
  controls: readonly Jet[],
  values: readonly number[],
): Jet {
  const read = (key: keyof Jet): Point =>
    V.combine([
      [1, base[key]],
      ...controls.map((basis, i): [number, Point] => [values[i]!, basis[key]]),
    ]);
  return {
    p: read("p"),
    u: read("u"),
    v: read("v"),
    uu: read("uu"),
    uv: read("uv"),
    vv: read("vv"),
  };
}
