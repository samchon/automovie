import { type IAutoMovieContourLoft64 as L, type IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import type { AutoMovieRecoveryMeshSections as R } from "./AutoMovieRecoveryMeshSections";
import type { cutExact } from "./mesh-observations/cutExact";
import type { planeFrame } from "./mesh-observations/planeFrame";
import { signedArea } from "./mesh-observations/signedArea";
import type { sourceOrientation } from "./mesh-observations/sourceOrientation";

/**
 * Observe and fit every contour on one fixed private section.
 *
 * @evidence contracts/common.md#principled-implementation The same source-face support, material-side winding, declared corner angles and cubic fit are applied in their original order.
 * @evidence contracts/common.md#clear-and-simple-design The extraction owner retains station/topology traversal while one helper owns section-local fitting and support lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing arithmetic, admission, coefficient authority and explicit failure meanings remain unchanged; no source geometry fallback is added.
 * @evidence contracts/common.md#meaningful-documentation States the owned stage and immutable inputs; output qualification remains with the caller.
 * @evidence contracts/performance.md#efficient-algorithms All section observations and their incident face supports are visited once; the unchanged fitter owns adaptive solve costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reuses its prepared data for the same original lifetime without a new cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Private supports transfer only to the observation caller and expire before curve publication; coefficients and scalar counts remain caller-owned.
 */
export function observeRecoverySection(input: {
  coordinateMm: number;
  plane: ReturnType<typeof planeFrame>;
  contours: ReturnType<ReturnType<typeof cutExact.prepare>>;
  faceEdges: ReadonlyMap<string, ReadonlySet<number>>;
  vertexFaces: ReadonlyMap<number, ReadonlySet<number>>;
  orientation: ReturnType<typeof sourceOrientation>;
  policy: Pick<R.Input, "cornerDegrees" | "toleranceMm" | "maxSpans">;
}): {
  section: L.ISection;
  report: R.Bundle["reports"][number];
  supports: Set<number>[];
  faces: Set<number>[];
  defects: Set<number>[];
  observations: number;
  spans: number;
} {
  const {
    coordinateMm,
    plane,
    contours,
    faceEdges,
    vertexFaces,
    orientation,
    policy,
  }: typeof input = input;
  let observations: number = 0,
    spans: number = 0;
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a},${b}` : `${b},${a}`);
  const section: L.ISection = { coordinateMm, loops: [] };
  const report: R.Bundle["reports"][number] = {
    coordinateMm,
    fits: [],
    open: [],
    isolatedContactsMm: [],
    diagnostics: [],
  };
  const supports: Set<number>[] = [];
  const faces: Set<number>[] = [],
    defects: Set<number>[] = [];
  for (let ci: number = 0; ci < contours.length; ci++) {
    const contour: (typeof contours)[number] = contours[ci]!;
    const faceSupport: Set<number> = new Set();
    for (const point of contour.pts) {
      const incident: ReadonlySet<number> | undefined =
        point.a === point.b
          ? vertexFaces.get(point.a)
          : faceEdges.get(edgeKey(point.a, point.b));
      if (incident) for (const ti of incident) faceSupport.add(ti);
    }
    try {
      let points: [number, number, number][] = contour.pts.map(
        (p: (typeof contour.pts)[number]): [number, number, number] => [...p.p],
      );
      if (points.length < (contour.closed ? 3 : 2)) {
        report.diagnostics.push(
          "Degenerate contour or isolated contact retained as unsupported",
        );
        for (const point of points) report.isolatedContactsMm.push(point);
        defects.push(faceSupport);
        continue;
      }
      let winding: 1 | -1 = 1;
      if (contour.closed) {
        winding = orientation(plane, contour) as 1 | -1;
        const area: number = signedArea(
          points.map((p: C.Vector): [number, number] => [
            (p[0] - plane.origin[0]) * plane.u[0] +
              (p[1] - plane.origin[1]) * plane.u[1] +
              (p[2] - plane.origin[2]) * plane.u[2],
            (p[0] - plane.origin[0]) * plane.v[0] +
              (p[1] - plane.origin[1]) * plane.v[1] +
              (p[2] - plane.origin[2]) * plane.v[2],
          ]),
        );
        if (area < 0) points = points.reverse();
      }
      const corners: number[] = [];
      for (
        let i: number = contour.closed ? 0 : 1;
        i < points.length - (contour.closed ? 0 : 1);
        i++
      ) {
        const a: C.Vector = points[(i + points.length - 1) % points.length]!,
          b: C.Vector = points[i]!,
          c: C.Vector = points[(i + 1) % points.length]!;
        const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
          v: number[] = c.map((x: number, k: number): number => x - b[k]!);
        const cosine: number =
          u.reduce(
            (s: number, x: number, k: number): number => s + x * v[k]!,
            0,
          ) /
          (Math.hypot(...u) * Math.hypot(...v));
        if (
          (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI >=
          policy.cornerDegrees
        )
          corners.push(i);
      }
      const fit: F.Result = F.fit({
        name: `section.${coordinateMm}.contour.${ci}`,
        pointsMm: points,
        closed: contour.closed,
        corners,
        toleranceMm: policy.toleranceMm,
        maxSpans: policy.maxSpans,
        parameterization: "chord",
      });
      observations += points.length;
      spans += fit.curve.spans.length;
      if (contour.closed) {
        (section.loops as { curve: C.Cubic; winding: 1 | -1 }[]).push({
          curve: fit.curve,
          winding,
        });
        const { curve: _curve, ...quality }: F.Result = fit;
        report.fits.push(quality);
        supports.push(
          new Set(
            contour.pts.flatMap((p: (typeof contour.pts)[number]): number[] => [
              p.a,
              p.b,
            ]),
          ),
        );
        faces.push(faceSupport);
      } else {
        report.open.push(fit);
        defects.push(faceSupport);
        report.diagnostics.push(
          "Open source contour: no surface bridge or cap is authorized for its slab component",
        );
      }
      if (!fit.toleranceMet)
        report.diagnostics.push(
          `Fitting tolerance unresolved for ${fit.curve.name}`,
        );
    } catch (failure: unknown) {
      defects.push(faceSupport);
      report.diagnostics.push(
        `Contour ${ci} unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
    }
  }
  return { section, report, supports, faces, defects, observations, spans };
}
