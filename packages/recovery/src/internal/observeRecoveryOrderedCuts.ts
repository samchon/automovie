import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { AutoMovieRecoveryOrderedLineage } from "../observation/AutoMovieRecoveryOrderedLineage";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";
import { RecoveryScalarIndex } from "./RecoveryScalarIndex";
import { bindRecoverySavedSectionCuts } from "./bindRecoverySavedSectionCuts";
import { cutExact } from "./mesh-observations/cutExact";
import { planeFrame } from "./mesh-observations/planeFrame";
import { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/** Reobserve requested saved planes without reading or fitting a coefficient.
 * The caller verifies native and saved artifact bytes; this function compares
 * their declared source/selection/frame identities and rechecks complete raw
 * populations, closure and broad/exact face sets through the official binder.
 * Binary64 cutting is not certified exact arithmetic. No aggregate metadata
 * byte ceiling or cancellation hook is provided; the synchronous caller bounds
 * its selected mesh and saved-plane request and keeps borrowed inputs immutable.
 *
 * @evidence contracts/common.md#principled-implementation The admitted mesh, normalized frame, scalar interval index and existing exact-zero cutter produce each raw contour; saved-cut binding verifies its ordinal, full support and closure before original face remapping and physical chord accumulation. Opaque identities do not verify bytes or semantic phase, and extreme finite chord arithmetic is not separately range-certified.
 * @evidence contracts/common.md#clear-and-simple-design One prepared mesh, one face map and one scalar index serve the requested planes; this operation only emits complete source-cut evidence, leaving coefficient correspondence to bindSavedFits and hash verification to the existing processor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no anatomical/person selector, largest-component filter, coordinate weld, nearest-root choice, coefficient replacement or normal fallback; empty planes, contacts, failed publications and every emitted alias witness survive.
 * @evidence contracts/common.md#meaningful-documentation The input/result comments distinguish canonical labels, original edges, broad versus exact faces, raw chord phase and copied acquisition evidence; this comment states caller identity, binary64, cancellation and byte-budget limitations.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T selected faces, K planes and per-plane active faces A, points P, incident-face visits I and original-edge witness visits W, admission/indexing costs O(V+T log T); indexed cuts and copied outputs add active-face sorting, P/I traversal, segment face sorting and the cutter's per-point linear witness deduplication, which can reach O(W squared) for many aliases. Complete saved populations are revisited to verify their binding; no whole named curve collection is fitted.
 * @evidence contracts/performance.md#reuse-equivalent-work A local-to-original injection, admitted incidence registry, vertex heights, interval index and cutter closure are reused only for this immutable source/frame/selection. Each distinct plane is cut once after duplicate rejection; persistent reuse is the processor's byte-verified named-stage responsibility, not identity-string caching here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call borrows source arrays and owns O(V+T) preparation plus active cut/binding data; its output grows with all requested contour points, witnesses and face addresses. Temporary references expire on return or throw and copied results transfer to the caller. There is no independent aggregate output-byte limit, handle, background task or cancellation listener.
 */
export function observeRecoveryOrderedCuts(
  input: AutoMovieRecoveryOrderedLineage.Input,
): AutoMovieRecoveryOrderedLineage.Cuts {
  const prepared: ReturnType<typeof prepareRecoveryMeshIncidence> =
    prepareRecoveryMeshIncidence(input, input.verticesMm);
  const frame: ReturnType<typeof planeFrame> = planeFrame(
    [0, 0, 0],
    input.axis,
    input.reference,
  );
  const physicalFrame: AutoMovieRecoveryOrderedLineage.Cuts["frame"] = {
    originMm: [...frame.origin],
    n: [...frame.n],
    u: [...frame.u],
    v: [...frame.v],
  };
  if (
    ![frame.n, frame.u, frame.v].every(
      (v: C.Vector): boolean =>
        v.every(Number.isFinite) && Math.abs(Math.hypot(...v) - 1) < 1e-10,
    )
  )
    throw new Error("Ordered lineage requires a finite orthonormal frame");
  if (
    input.originalTriangleIds.length !== input.triangles.length ||
    new Set(input.originalTriangleIds).size !== input.triangles.length ||
    input.originalTriangleIds.some(
      (v: number): boolean => !Number.isSafeInteger(v) || v < 0,
    )
  )
    throw new Error("Original face mapping is not a complete injection");
  const inverse: Map<number, number> = new Map(
    input.originalTriangleIds.map((id: number, i: number): [number, number] => [
      id,
      i,
    ]),
  );
  const local: (ids: readonly number[]) => number[] = (
    ids: readonly number[],
  ): number[] =>
    ids.map((id: number): number => {
      const value: number | undefined = inverse.get(id);
      if (value === undefined)
        throw new Error(
          "Saved lineage contains a face outside the declared source selection",
        );
      return value;
    });
  const heights: number[] = input.verticesMm.map(
    (p: C.Vector): number =>
      p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
  );
  const index: ReturnType<typeof RecoveryScalarIndex.create> =
    RecoveryScalarIndex.create(input.triangles, heights);
  const cut: ReturnType<typeof cutExact.prepare> = cutExact.prepare(
    prepared.mesh,
    heights,
    true,
    true,
  );
  const sections: AutoMovieRecoveryOrderedLineage.Cuts["sections"] = [];
  const seen: Set<number> = new Set();
  for (const saved of input.savedSections) {
    if (
      seen.has(saved.coordinateMm) ||
      !Number.isFinite(saved.coordinateMm) ||
      saved.sourceIdentity !== input.sourceIdentity ||
      saved.sourceSelectionIdentity !== input.sourceSelectionIdentity ||
      saved.exactCoordinateAliases !== input.exactCoordinateAliases ||
      JSON.stringify(saved.frame) !== JSON.stringify(physicalFrame)
    )
      throw new Error(
        "Saved ordered cut has a duplicate plane or foreign source/frame binding",
      );
    seen.add(saved.coordinateMm);
    const plane: ReturnType<typeof planeFrame> = {
      ...frame,
      origin: [
        frame.n[0] * saved.coordinateMm,
        frame.n[1] * saved.coordinateMm,
        frame.n[2] * saved.coordinateMm,
      ],
    };
    const raw: ReturnType<typeof cut> = cut(
      plane,
      saved.coordinateMm,
      index.cut(saved.coordinateMm),
    );
    const bound: ReturnType<typeof bindRecoverySavedSectionCuts> =
      bindRecoverySavedSectionCuts({
        saved: {
          ...saved,
          sourceLineage: saved.sourceLineage.map(
            (
              r: (typeof saved.sourceLineage)[number],
            ): (typeof saved.sourceLineage)[number] => ({
              ...r,
              sourceTriangleIds: local(r.sourceTriangleIds),
              ...(r.exactSourceTriangleIds === undefined
                ? {}
                : { exactSourceTriangleIds: local(r.exactSourceTriangleIds) }),
            }),
          ),
        },
        contours: raw,
        prepared,
        checkpoint: (): void => {},
      });
    if (bound.status !== "bound") throw new Error(bound.diagnostic);
    const contours: AutoMovieRecoveryOrderedLineage.Contour[] = raw.map(
      (
        c: (typeof raw)[number],
        contourIndex: number,
      ): AutoMovieRecoveryOrderedLineage.Contour => {
        const cumulative: number[] = [0];
        for (let i: number = 1; i < c.pts.length; i++)
          cumulative.push(
            cumulative.at(-1)! + distance(c.pts[i - 1]!.p, c.pts[i]!.p),
          );
        const expected: number = c.closed
          ? c.pts.length
          : Math.max(0, c.pts.length - 1);
        if ((c.orderedSegments?.length ?? 0) !== expected)
          throw new Error(
            "The official cutter omitted an ordered source segment",
          );
        const segments: AutoMovieRecoveryOrderedLineage.Contour["segments"] = (
          c.orderedSegments ?? []
        ).map(
          (
            s: NonNullable<typeof c.orderedSegments>[number],
            i: number,
          ): AutoMovieRecoveryOrderedLineage.Contour["segments"][number] => {
            const to: number = (i + 1) % c.pts.length;
            const startMm: number = cumulative[i]!;
            const endMm: number =
              to === 0
                ? startMm + distance(c.pts[i]!.p, c.pts[0]!.p)
                : cumulative[to]!;
            return {
              id: s.id,
              from: i,
              to,
              startMm,
              endMm,
              originalTriangleIds: s.sourceTriangleIds.map(
                (id: number): number => input.originalTriangleIds[id]!,
              ),
            };
          },
        );
        const lineage: IAutoMovieRecoverySourceLineage =
          bound.value.sourceLineage[contourIndex]!;
        return {
          contourIndex,
          closed: c.closed,
          publication: { ...lineage.publication },
          sourceTriangleIds: lineage.sourceTriangleIds.map(
            (id: number): number => input.originalTriangleIds[id]!,
          ),
          exactSourceTriangleIds: lineage.exactSourceTriangleIds!.map(
            (id: number): number => input.originalTriangleIds[id]!,
          ),
          points: c.pts.map(
            (
              p: (typeof c.pts)[number],
            ): AutoMovieRecoveryOrderedLineage.Contour["points"][number] => ({
              p: [...p.p],
              a: p.a,
              b: p.b,
              t: p.t,
              ...(p.sourceEdges === undefined
                ? {}
                : {
                    sourceEdges: p.sourceEdges.map(
                      (
                        e: NonNullable<typeof p.sourceEdges>[number],
                      ): NonNullable<
                        AutoMovieRecoveryOrderedLineage.Contour["points"][number]["sourceEdges"]
                      >[number] => ({ ...e, pointMm: [...e.pointMm] }),
                    ),
                  }),
            }),
          ),
          cumulativePolylineMm: cumulative,
          totalPolylineMm: segments.at(-1)?.endMm ?? 0,
          segments,
        };
      },
    );
    sections.push({
      coordinateMm: saved.coordinateMm,
      observationIdentity: saved.observationIdentity,
      contours,
    });
  }
  return {
    name: input.name,
    sourceIdentity: input.sourceIdentity,
    sourceSelectionIdentity: input.sourceSelectionIdentity,
    frame: physicalFrame,
    sections,
  };
}
/** Measure a chord between two registered observation points in mm.
 * Math.hypot limits intermediate sum overflow but is not exact arithmetic;
 * extreme finite inputs can still produce Infinity, which this helper does
 * not independently refuse. No approximation or coordinate correction occurs.
 *
 */
function distance(a: C.Vector, b: C.Vector): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
