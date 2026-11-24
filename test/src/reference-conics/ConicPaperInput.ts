import type {
  AutoMovieVector2Tuple,
  IAutoMovieCubicCriticalParameters,
  IAutoMoviePlanarCurveSource,
} from "@automovie/interface";
import { AutoMovieRecoveryConicApproximation as C } from "@automovie/recovery";

/** Explicit section-curve inputs and their exact cubic chart evaluation. */
export namespace ConicPaperInput {
  /** Weak source-identity reuse shares exact preprocessing between the two methods without retaining source curves. */
  const criticalCache: WeakMap<Span, IAutoMovieCubicCriticalParameters> =
    new WeakMap();
  /** Spatial coefficients retain the saved millimetre, +X forward/+Y up/+Z left chart. */
  export type V = readonly [number, number, number];
  /** Four actual Bernstein controls, not interpolated display points. */
  export type Span = readonly [V, V, V, V];
  /** The saved source curve fields needed for independent planar fitting. */
  export interface Curve {
    /** Saved coefficient basis, validated before a chart is evaluated. */
    type: "cubicBezier";
    /** Original stable Recovery curve identity, retained in image attribution. */
    name: string;
    /** Declared source closure; geometric ring admission remains separate. */
    closed: boolean;
    /** Original positive source phase widths; fitting uses one independent normalized chart per span. */
    phaseIntervals: number[];
    /** Ordered millimetre Bernstein controls in the published world chart. */
    spans: Span[];
  }
  /** Index-selected final loft input and its original continuation relationships. */
  export interface Loop {
    /** Unique saved section ordinal and closed-loop ordinal joined by a colon. */
    key: string;
    /** Original source section index, including intervening empty sections. */
    section: number;
    /** Closed-loop ordinal within that source section, never a region-local index. */
    ordinal: number;
    /** World Y coordinate of the section plane, in millimetres. */
    heightMm: number;
    /** Saved geometric region label, used only to aggregate evidence. */
    region: string;
    /** Saved ok/suspect/broken verdict; none is silently filtered out. */
    quality: string;
    /** Saved connected mesh-component identity; zero identifies the largest skin component. */
    component: number;
    /** Closed-loop ordinals in the immediately preceding section, from the saved link graph. */
    below: number[];
    /** Closed-loop ordinals in the immediately following section, from the saved link graph. */
    above: number[];
    /** Original source coefficients resolved through the index file ordinal. */
    curve: Curve;
  }
  /** Complete selected input with byte provenance and original unresolved-section information. */
  export interface Packet {
    /** Every index-selected closed loop, sorted by source section and loop ordinal. */
    loops: Loop[];
    /** Total number of original section records, including empty sections. */
    sections: number;
    /** Sections flagged inside an unresolved source topology gap. */
    topologyGapSections: number;
    /** Actual bytes and SHA-256 identity of the index and each consumed coefficient file. */
    hashes: { file: string; sha256: string; bytes: number }[];
    /** Wall time for discovery, reading, hashing, parsing and joining, in milliseconds. */
    loadMs: number;
  }
  /** Source-critical preprocessing work and boundaries, separate from fitted conic coefficients and solver queries. */
  export interface CriticalSummary {
    /** Actual source cubic charts whose critical coefficients were inspected. */
    charts: number;
    /** Interior candidates at zero source velocity; no tangent is substituted there. */
    stationaryRoots: number;
    /** Interior roots of the planar curvature numerator. */
    zeroCurvatureRoots: number;
    /** Interior affine-curvature critical candidates, required by Ghosh only. */
    affineCriticalRoots: number;
    /** Charts with identically zero curvature numerator; stationary candidates still remain mandatory. */
    collinearCharts: number;
    /** Exact-value distinct roots selected for this method before source-chart mapping. */
    selectedBreaks: number;
    /** Roots lost to a source endpoint or another root after ordinal mapping; these refuse the chart. */
    collapsedBreaks: number;
    /** Charts whose source coefficients were newly processed. */
    computedCharts: number;
    /** Charts reusing preprocessing of the identical unchanged source span. */
    cachedCharts: number;
    /** Source-critical evaluation, mapping and cache lookup time, in milliseconds. */
    milliseconds: number;
  }
  /** Evaluate one cubic's exact Bernstein derivatives; derivatives four and five vanish inside its chart. */
  export function value(
    span: Span,
    u: number,
    order: 0 | 1 | 2 | 3 | 4 | 5,
  ): Readonly<AutoMovieVector2Tuple> {
    if (order >= 4) return [0, 0];
    let controls: Readonly<AutoMovieVector2Tuple>[] = span.map(
      (p: V): Readonly<AutoMovieVector2Tuple> => [p[0], p[2]],
    );
    for (let k: number = 0; k < order; ++k) {
      const degree: number = controls.length - 1;
      controls = controls
        .slice(1)
        .map(
          (
            p: Readonly<AutoMovieVector2Tuple>,
            i: number,
          ): Readonly<AutoMovieVector2Tuple> => [
            degree * (p[0] - controls[i]![0]),
            degree * (p[1] - controls[i]![1]),
          ],
        );
    }
    while (controls.length > 1)
      controls = controls
        .slice(1)
        .map(
          (
            p: Readonly<AutoMovieVector2Tuple>,
            i: number,
          ): Readonly<AutoMovieVector2Tuple> => [
            (1 - u) * controls[i]![0] + u * p[0],
            (1 - u) * controls[i]![1] + u * p[1],
          ],
        );
    return controls[0]!;
  }

  /** Exact critical boundaries split the original cubic without changing its values, jets, controls or phase registration. */
  export function chart(
    span: Span,
    ordinal: number,
    query: () => void,
    method: "ahn" | "ghosh",
    report: (summary: CriticalSummary, diagnostics: readonly string[]) => void,
  ): IAutoMoviePlanarCurveSource {
    const started: number = performance.now();
    let critical: IAutoMovieCubicCriticalParameters | undefined =
      criticalCache.get(span);
    const cached: boolean = critical !== undefined;
    if (critical === undefined) {
      critical = C.cubicCriticalParameters([
        [span[0][0], span[0][2]],
        [span[1][0], span[1][2]],
        [span[2][0], span[2][2]],
        [span[3][0], span[3][2]],
      ]);
      criticalCache.set(span, critical);
    }
    const selected: number[] = [
      ...new Set([
        ...critical.stationary,
        ...critical.zeroCurvature,
        ...(method === "ghosh" ? critical.affineCritical : []),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const mapped: number[] = selected.map((u: number): number => ordinal + u);
    const distinct: Set<number> = new Set(
      mapped.filter((t: number): boolean => t > ordinal && t < ordinal + 1),
    );
    const collapsed: number = selected.length - distinct.size;
    report(
      {
        charts: 1,
        stationaryRoots: critical.stationary.length,
        zeroCurvatureRoots: critical.zeroCurvature.length,
        affineCriticalRoots: critical.affineCritical.length,
        collinearCharts: Number(critical.collinear),
        selectedBreaks: selected.length,
        collapsedBreaks: collapsed,
        computedCharts: Number(!cached),
        cachedCharts: Number(cached),
        milliseconds: performance.now() - started,
      },
      critical.diagnostics,
    );
    if (collapsed > 0)
      throw new Error(
        "Source cubic " +
          ordinal +
          " has " +
          collapsed +
          " critical roots unrepresentable in its ordinal chart; no epsilon move or merge was applied.",
      );
    return {
      domain: [ordinal, ordinal + 1],
      breaks: mapped,
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => {
        query();
        return value(span, t - ordinal, 0);
      },
      derivative: (
        t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => {
        query();
        return value(span, t - ordinal, order);
      },
    };
  }
}
