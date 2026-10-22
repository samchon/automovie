import {
  type IAutoMovieCurve64 as C,
  type IAutoMovieContourLoft64 as L,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMeshSections } from "../structures/mesh/IAutoMovieRecoveryMeshSections";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";
import { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import { collectRecoveryContourFaceSupport } from "./collectRecoveryContourFaceSupport";
import type { cutExact } from "./mesh-observations/cutExact";
import type { planeFrame } from "./mesh-observations/planeFrame";
import { signedArea } from "./mesh-observations/signedArea";
import type { sourceOrientation } from "./mesh-observations/sourceOrientation";

/**
 * Observe and fit every contour on one fixed private section. An optional collection name prefixes curve identities; an optional acquisition observer receives copied original face incidence after local fitting, including rejected contours. Observer exceptions escape the fitting catch.
 *
 * @evidence contracts/common.md#principled-implementation Original source support, material winding, corner policy and Schneider fitting preserve their order. The opt-in callback copies that solve's accepted parameters and explicit raw-order reversal; it does not certify historical trace identity, material phase, source tolerance or transverse surface jets.
 * @evidence contracts/common.md#clear-and-simple-design The section owner retains fitting, publication and diagnostics; separate callbacks expose copied lineage and accepted parameters. Delivery in finally lies outside the fit failure catch so observer exceptions escape rather than becoming numerical failure diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default fitting inputs and arithmetic stay unchanged. No source-person branch, correction, nearest-point phase guess, averaged derivative, replacement curve or source-normal fallback is added; a current trace is not presented as proven historical parameters.
 * @evidence contracts/common.md#meaningful-documentation Callback members define this-call contour ordinal, signed-area reversal, accepted fit-local span ordinal, inclusive reordered point indices including closed index N, and dimensionless chord/Newton t distinct from raw mm h and saved physical phase. Copied ownership and escaping exceptions are explicit; original reports retain tolerance and open/contact limits.
 * @evidence contracts/performance.md#efficient-algorithms For P observations, I incident-face visits and S spans, support/preparation retains P/I traversal and the existing balanced O(P log S), worst O(P squared) fit. Opt-in traces copy O(P+S) accepted parameters; default calls allocate no trace array, and observer work remains caller-owned.
 * @evidence contracts/performance.md#reuse-equivalent-work One existing fit supplies publication, diagnostics and optional accepted parameters with no second fit, cut or conversion. No persistent cache is added; saved-cut admission and stage receipt owners decide historical equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain borrowed synchronously. Local support, fit and trace data grow with contour points/incidence/spans; returned curves and callback copies transfer to callers, including copies retained by observers. Temporary references expire on completion or throw; no independent metadata byte ceiling, listener, task or cancellation hook is added.
 */
export function observeRecoverySection(input: {
  coordinateMm: number;
  plane: ReturnType<typeof planeFrame>;
  contours: ReturnType<ReturnType<typeof cutExact.prepare>>;
  faceEdges: ReadonlyMap<string, ReadonlySet<number>>;
  vertexFaces: ReadonlyMap<number, ReadonlySet<number>>;
  orientation: ReturnType<typeof sourceOrientation>;
  policy: Pick<
    IAutoMovieRecoveryInput,
    "cornerDegrees" | "toleranceMm" | "maxSpans"
  >;
  name?: string;
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

  /** Acquisition-only copied accepted trace, delivered outside the fitter failure catch.
   * Observer exceptions escape. Acceptance does not itself imply the original
   * fit met tolerance, and no historical accepted trace is asserted.
   */
  onAcceptedFit?: (trace: {
    /** Ordinal in this call's input.contours before fitting/rejection; a one-contour replay reports zero, not its saved outer contour ordinal. */
    contourIndex: number;

    /** True only when a closed contour's negative signed plane area caused its input point order to reverse before fitting; open paths are not reversed. */
    reversed: boolean;

    /** Accepted spans in this contour's current fit order; adjacent spans retain their shared observation separately. */
    spans: Array<{
      /** Zero-based ordinal within this contour's accepted fit, independent of source contour, section or publication ordinals. */
      span: number;

      /** Inclusive first index in the fitting point list after any reversal; closed input appends its reordered first point at index N, where N is the raw point count. */
      first: number;

      /** Inclusive last index in the same fitting list; N denotes the repeated closed start, and a shared knot may be both one span's last and the next span's first. */
      last: number;

      /** One accepted dimensionless local t in [0,1] per inclusive point, from initial chord parameters or accepted safeguarded Newton refinement; neither raw cumulative mm h nor fitted physical phase. */
      parameters: number[];
    }>;
  }) => void;
}): {
  section: L.ISection;
  report: IAutoMovieRecoveryMeshSections["reports"][number];
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
    /** Current optional callback record; this alias makes no historical parameter claim.
     *
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
      const fit: F.Result = F.fit(
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
