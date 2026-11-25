import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieCubicBezierCurve64,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoverySectionObservationOperation,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import { collectRecoveryContourFaceSupport } from "./collectRecoveryContourFaceSupport";
import { signedArea } from "./mesh-observations/signedArea";

/**
 * Observe and fit every contour on one fixed private section. An optional
 * collection name prefixes curve identities; an optional acquisition observer
 * receives copied original face incidence after local fitting, including
 * rejected contours. Observer exceptions escape the fitting catch.
 */
export function observeRecoverySection(
  input: Parameters<IAutoMovieRecoverySectionObservationOperation.Operation>[0],
): ReturnType<IAutoMovieRecoverySectionObservationOperation.Operation> {
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
  const loops: { curve: IAutoMovieCubicBezierCurve64; winding: 1 | -1 }[] = [];
  const section: IAutoMovieContourLoft64.ISection = { coordinateMm, loops };
  const report: IAutoMovieRecoveryMeshSections["reports"][number] = {
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
    const faceSupport: Set<number> = collectRecoveryContourFaceSupport(
      contour.pts,
      vertexFaces,
      faceEdges,
      edgeKey,
    );
    let publication: IAutoMovieRecoverySourceLineage["publication"] | undefined;

    /**
     * Current optional callback record; this alias makes no historical
     * parameter claim.
     */
    type Accepted = Parameters<NonNullable<typeof input.onAcceptedFit>>[0];
    const accepted: Accepted["spans"] | undefined =
      input.onAcceptedFit === undefined ? undefined : [];
    let acceptedFit: Accepted | undefined;
    let reversed: boolean = false;
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
        winding = orientation(plane, contour) < 0 ? -1 : 1;
        const area: number = signedArea(
          points.map((p: Readonly<AutoMovieVector3Tuple>): [number, number] => [
            (p[0] - plane.origin[0]) * plane.u[0] +
              (p[1] - plane.origin[1]) * plane.u[1] +
              (p[2] - plane.origin[2]) * plane.u[2],
            (p[0] - plane.origin[0]) * plane.v[0] +
              (p[1] - plane.origin[1]) * plane.v[1] +
              (p[2] - plane.origin[2]) * plane.v[2],
          ]),
        );
        if (area < 0) {
          points = points.reverse();
          reversed = true;
        }
      }
      const corners: number[] = [];
      for (
        let i: number = contour.closed ? 0 : 1;
        i < points.length - (contour.closed ? 0 : 1);
        i++
      ) {
        const a: Readonly<AutoMovieVector3Tuple> =
            points[(i + points.length - 1) % points.length]!,
          b: Readonly<AutoMovieVector3Tuple> = points[i]!,
          c: Readonly<AutoMovieVector3Tuple> = points[(i + 1) % points.length]!;
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
      const fit: IAutoMoviePolylineFit = F.fit(
        {
          name: `${input.name ?? "section"}.${coordinateMm}.contour.${ci}`,
          pointsMm: points,
          closed: contour.closed,
          corners,
          toleranceMm: policy.toleranceMm,
          maxSpans: policy.maxSpans,
          parameterization: "chord",
        },
        input.onAcceptedFit === undefined
          ? undefined
          : (
              span: number,
              first: number,
              last: number,
              parameters: readonly number[],
            ): void => {
              accepted!.push({
                span,
                first,
                last,
                parameters: [...parameters],
              });
            },
      );
      if (accepted !== undefined)
        acceptedFit = { contourIndex: ci, reversed, spans: accepted };
      observations += points.length;
      spans += fit.curve.spans.length;
      if (contour.closed) {
        if (input.onSourceLineage)
          publication = {
            kind: "closed",
            loopIndex: section.loops.length,
            curveName: fit.curve.name,
          };
        loops.push({
          curve: fit.curve,
          winding,
        });
        const { curve: _curve, ...quality }: IAutoMoviePolylineFit = fit;
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
        if (input.onSourceLineage)
          publication = {
            kind: "open",
            reportIndex: report.open.length,
            curveName: fit.curve.name,
          };
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
      if (input.onSourceLineage)
        publication = {
          kind: "failed",
          diagnostic:
            failure instanceof Error ? failure.message : String(failure),
        };
      defects.push(faceSupport);
      report.diagnostics.push(
        `Contour ${ci} unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
    } finally {
      input.onSourceLineage?.({
        coordinateMm,
        contourIndex: ci,
        sourceTriangleIds: [...faceSupport],
        ...(contour.exactSourceTriangleIds === undefined
          ? {}
          : { exactSourceTriangleIds: [...contour.exactSourceTriangleIds] }),
        publication: publication ?? { kind: "degenerate" },
      });
      if (acceptedFit !== undefined) input.onAcceptedFit?.(acceptedFit);
    }
  }
  return { section, report, supports, faces, defects, observations, spans };
}
