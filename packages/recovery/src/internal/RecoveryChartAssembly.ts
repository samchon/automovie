import {
  type IAutoMovieCurve64 as C,
  AutoMovieBernstein64 as S,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieBicubicAtlasGeometry as G } from "@automovie/interface";

import type { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import { RecoveryChartLeafAssembly } from "./RecoveryChartLeafAssembly";
import type { RecoveryChartLeafFit } from "./RecoveryChartLeafFit";

/**
 * Assemble fitted chart fields using one canonical boundary coefficient registry.
 * Equal declared boundary intervals share four exact coefficient IDs, including
 * reversal; coincident independent sheets retain distinct IDs. Different edge
 * partitions retain common analytic curves but report unmatched tessellation spans.
 * Physical transverse jets and coarse/fine edge-sample conformity are separate work.
 * Stored oriented knots map directly to their canonical counterparts without a
 * subtraction round trip. Each canonical endpoint has one evaluation owner; its
 * binary64 restriction difference is measured against the fitted field below.
 *
 * @evidence contracts/common.md#principled-implementation Saved canonical boundary cubics are restricted once per declared parameter interval. Shared boundary and corner identities determine coefficient equality, while every interior coefficient retains its fitted chart owner.
 * @evidence contracts/common.md#clear-and-simple-design One assembly operation owns the public coefficient registry and reports canonical restriction differences and boundary partition compatibility before engine realization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity and phase intervals, not coordinate proximity, establish sharing. No source vertex, face, normal, forced crease smoothing or external mesh enters the output.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, orientation, canonical restriction, exact matching-span sharing and unresolved coarse/fine tessellation and transverse derivatives.
 * @evidence contracts/performance.md#efficient-algorithms For C fitted controls and E boundary spans, assembly uses expected O(C+E) registry work and constant-degree restriction per unique boundary interval; output retains O(C+E) coefficient identities.
 * @evidence contracts/performance.md#reuse-equivalent-work Every canonical edge restriction and coefficient is evaluated once and reused by all matching oriented incidents; chart interiors retain their sole fitted values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and counters are local to one bounded chart batch and expire on return. Public coefficients, patches and scalar diagnostics transfer to the observation caller; no source observations or handles are retained.
 */
export function RecoveryChartAssembly(
  charts: readonly {
    name: string;
    controlsMm: readonly C.Vector[];
    patches: readonly { id: string; controlIds: readonly number[] }[];
    partition: { u: readonly number[]; v: readonly number[] };
    boundaries: readonly ReturnType<
      ReturnType<typeof RecoveryChartBoundary>["get"]
    >[];
    leafLayout?: ReturnType<typeof RecoveryChartLeafFit>["leafLayout"];
  }[],
): {
  controlsMm: C.Vector[];
  patches: { id: string; controlIds: number[] }[];
  diagnostics: string[];
  maximumCanonicalRestrictionDifferenceMm: number;
  sharedBoundarySpans: number;
  unmatchedBoundarySpans: number;
  boundaryAuthorities?: G["boundaryAuthorities"];
  boundaryBindings?: G["boundaryBindings"];
} {
  if (
    charts.length &&
    charts.every(
      (chart: (typeof charts)[number]): boolean =>
        chart.leafLayout !== undefined,
    )
  )
    return RecoveryChartLeafAssembly(
      charts.map(
        (
          chart: (typeof charts)[number],
        ): Parameters<typeof RecoveryChartLeafAssembly>[0][number] => ({
          ...chart,
          leafLayout: chart.leafLayout!,
        }),
      ),
    );
  const controlsMm: C.Vector[] = [],
    patches: { id: string; controlIds: number[] }[] = [],
    diagnostics: string[] = [];
  const ids: Map<string, number> = new Map(),
    spans: Map<string, { net: C.Span; uses: number; boundary: string }> =
      new Map(),
    boundaryUses: Map<string, number> = new Map(),
    endpoints: Map<string, C.Vector> = new Map();
  let maximumCanonicalRestrictionDifferenceMm: number = 0;
  const install: (key: string, point: C.Vector) => number = (
    key: string,
    point: C.Vector,
  ): number => {
    const existing: number | undefined = ids.get(key);
    if (existing !== undefined) {
      const old: C.Vector = controlsMm[existing]!;
      if (old.some((x: number, k: number): boolean => x !== point[k]))
        throw new Error(
          "One declared canonical coefficient has conflicting values",
        );
      return existing;
    }
    const id: number = controlsMm.length;
    controlsMm.push(point);
    ids.set(key, id);
    return id;
  };
  for (const chart of charts) {
    const nu: number = chart.partition.u.length - 1,
      nv: number = chart.partition.v.length - 1,
      stride: number = 3 * nu + 1,
      local: number[] = new Array<number>(chart.controlsMm.length).fill(-1);
    if (
      chart.boundaries.length !== 4 ||
      chart.controlsMm.length !== stride * (3 * nv + 1)
    )
      throw new Error(
        "A fitted tensor chart and four complete boundary authorities are required",
      );
    for (let side: number = 0; side < 4; side++) {
      const binding: (typeof chart.boundaries)[number] =
          chart.boundaries[side]!,
        knots: readonly number[] =
          side === 0 || side === 2 ? chart.partition.u : chart.partition.v;
      const canonicalParameter: (value: number) => number = (
        value: number,
      ): number => {
        const own: number = binding.knots.indexOf(value);
        return own < 0
          ? binding.reversed
            ? 1 - value
            : value
          : binding.canonicalKnots[
              binding.reversed ? binding.knots.length - 1 - own : own
            ]!;
      };
      const endpoint: (parameter: number) => C.Vector = (
        parameter: number,
      ): C.Vector => {
        const key: string = `${binding.id}.at.${parameter}`,
          previous: C.Vector | undefined = endpoints.get(key);
        if (previous) return previous;
        const knot: number = binding.canonicalKnots.indexOf(parameter),
          which: number =
            parameter === 1
              ? binding.canonicalKnots.length - 2
              : binding.canonicalKnots.findIndex(
                  (end: number, i: number): boolean => i > 0 && parameter < end,
                ) - 1;
        const original: C.Span = binding.canonicalCurve.spans[which]!,
          localParameter: number =
            (parameter - binding.canonicalKnots[which]!) /
            (binding.canonicalKnots[which + 1]! -
              binding.canonicalKnots[which]!);
        const point: C.Vector =
          knot >= 0
            ? parameter === 1
              ? original[3]
              : original[0]
            : S.split(
                original.map((p: C.Vector): [number, number, number] => [
                  p[0],
                  p[1],
                  p[2],
                ]),
                localParameter,
              )[0][3]!;
        endpoints.set(key, point);
        return point;
      };
      boundaryUses.set(binding.id, (boundaryUses.get(binding.id) ?? 0) + 1);
      for (let interval: number = 0; interval + 1 < knots.length; interval++) {
        const a: number = canonicalParameter(
            knots[binding.reversed ? interval + 1 : interval]!,
          ),
          b: number = canonicalParameter(
            knots[binding.reversed ? interval : interval + 1]!,
          ),
          key: string = `${binding.id}:${a}:${b}`;
        let span: { net: C.Span; uses: number; boundary: string } | undefined =
          spans.get(key);
        if (!span) {
          const which: number =
            a === 1
              ? binding.canonicalKnots.length - 2
              : binding.canonicalKnots.findIndex(
                  (end: number, i: number): boolean => i > 0 && a < end,
                ) - 1;
          const start: number = binding.canonicalKnots[which]!,
            end: number = binding.canonicalKnots[which + 1]!;
          if (!(a >= start && b <= end && b > a))
            throw new Error(
              "A canonical boundary interval crosses an unregistered coefficient knot",
            );
          const raw: C.Span = S.restrict(
            binding.canonicalCurve.spans[which]!.map(
              (point: C.Vector): [number, number, number] => [
                point[0],
                point[1],
                point[2],
              ],
            ),
            (a - start) / (end - start),
            (b - start) / (end - start),
          ) as unknown as C.Span;
          const net: C.Span = [endpoint(a), raw[1], raw[2], endpoint(b)];
          span = { net, uses: 0, boundary: binding.id };
          spans.set(key, span);
        }
        span.uses++;
        for (let k: number = 0; k < 4; k++) {
          const canonical: number = binding.reversed ? 3 - k : k,
            point: C.Vector = span.net[canonical]!,
            at: number =
              side === 0
                ? 3 * interval + k
                : side === 2
                  ? 3 * nv * stride + 3 * interval + k
                  : side === 1
                    ? (3 * interval + k) * stride + 3 * nu
                    : (3 * interval + k) * stride;
          const parameter: number = canonical === 0 ? a : b;
          const corner: string | undefined =
            k === 0 && interval === 0
              ? binding.corners[0]
              : k === 3 && interval + 2 === knots.length
                ? binding.corners[1]
                : undefined;
          const controlKey: string =
            corner ??
            (canonical === 0 || canonical === 3
              ? `${binding.id}.at.${parameter}`
              : `${key}.handle.${canonical}`);
          const old: C.Vector = chart.controlsMm[at]!;
          maximumCanonicalRestrictionDifferenceMm = Math.max(
            maximumCanonicalRestrictionDifferenceMm,
            Math.hypot(old[0] - point[0], old[1] - point[1], old[2] - point[2]),
          );
          local[at] = install(controlKey, point);
        }
      }
    }
    for (const patch of chart.patches)
      patches.push({
        id: patch.id,
        controlIds: patch.controlIds.map((id: number): number => {
          if (local[id]! < 0)
            local[id] = install(
              `${chart.name}.interior.${id}`,
              chart.controlsMm[id]!,
            );
          return local[id]!;
        }),
      });
  }
  const sharedBoundarySpans: number = [...spans.values()].filter(
      (span: { uses: number }): boolean => span.uses > 1,
    ).length,
    unmatchedBoundarySpans: number = [...spans.values()].filter(
      (span: { uses: number; boundary: string }): boolean =>
        span.uses === 1 && boundaryUses.get(span.boundary)! > 1,
    ).length;
  if (unmatchedBoundarySpans)
    diagnostics.push(
      `${unmatchedBoundarySpans} shared analytic boundary spans have unmatched tessellation partitions; coarse/fine edge samples remain unqualified`,
    );
  if (maximumCanonicalRestrictionDifferenceMm > 0)
    diagnostics.push(
      `Canonical boundary restriction changes fitted tensor boundary controls by at most ${maximumCanonicalRestrictionDifferenceMm} mm; add this binary64 estimate to reported observation residuals`,
    );
  return {
    controlsMm,
    patches,
    diagnostics,
    maximumCanonicalRestrictionDifferenceMm,
    sharedBoundarySpans,
    unmatchedBoundarySpans,
  };
}
