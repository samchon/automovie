import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshPlaneCut,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryOrderedContour,
  IAutoMovieRecoveryOrderedCuts,
  IAutoMovieRecoveryOrderedLineage,
  IAutoMovieRecoverySavedSectionCutsBindingOperation,
  IAutoMovieRecoveryScalarIndex,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { AutoMovieRecoveryScalarIndex } from "../../geometry/AutoMovieRecoveryScalarIndex";
import { bindRecoverySavedSectionCuts } from "./bindRecoverySavedSectionCuts";
import { prepareCutExact } from "../../internal/mesh-observations/prepareCutExact";
import { planeFrame } from "./planeFrame";
import { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/*
 * Reobserve requested saved planes without reading or fitting a coefficient.
 * The caller verifies native and saved artifact bytes; this function compares
 * their declared source/selection/frame identities and rechecks complete raw
 * populations, closure and broad/exact face sets through the official binder.
 * Binary64 cutting is not certified exact arithmetic. No aggregate metadata
 * byte ceiling or cancellation hook is provided; the synchronous caller bounds
 * its selected mesh and saved-plane request and keeps borrowed inputs
 * immutable.
 */
export function observeRecoveryOrderedCuts(
  input: IAutoMovieRecoveryOrderedLineage.Input,
): IAutoMovieRecoveryOrderedCuts {
  const prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> =
    prepareRecoveryMeshIncidence(input, input.verticesMm);
  const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
    planeFrame([0, 0, 0], input.axis, input.reference);
  const physicalFrame: IAutoMovieRecoveryOrderedCuts["frame"] = {
    originMm: [...frame.origin],
    n: [...frame.n],
    u: [...frame.u],
    v: [...frame.v],
  };
  if (
    ![frame.n, frame.u, frame.v].every(
      (v: Readonly<AutoMovieVector3Tuple>): boolean =>
        Math.abs(Math.hypot(...v) - 1) < 1e-10,
    )
  )
    throw new Error("Ordered lineage requires a finite orthonormal frame");
  if (
    input.originalTriangleIds.length !== input.triangles.length ||
    new Set(input.originalTriangleIds).size !== input.triangles.length ||
    input.originalTriangleIds.some((v: number): boolean => v < 0)
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
    (p: Readonly<AutoMovieVector3Tuple>): number =>
      p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
  );
  const index: ReturnType<IAutoMovieRecoveryScalarIndex.Create> =
    AutoMovieRecoveryScalarIndex.create(input.triangles, heights);
  const cut: ReturnType<IAutoMovieMeshPlaneCut.Prepare> = prepareCutExact(
    prepared.mesh,
    heights,
    true,
    true,
  );
  const sections: IAutoMovieRecoveryOrderedCuts["sections"] = [];
  const seen: Set<number> = new Set();
  for (const saved of input.savedSections) {
    if (
      seen.has(saved.coordinateMm) ||
      saved.sourceIdentity !== input.sourceIdentity ||
      saved.sourceSelectionIdentity !== input.sourceSelectionIdentity ||
      saved.exactCoordinateAliases !== input.exactCoordinateAliases ||
      JSON.stringify(saved.frame) !== JSON.stringify(physicalFrame)
    )
      throw new Error(
        "Saved ordered cut has a duplicate plane or foreign source/frame binding",
      );
    seen.add(saved.coordinateMm);
    const plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> = {
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
    const bound: ReturnType<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation> =
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
    const contours: IAutoMovieRecoveryOrderedContour[] = raw.map(
      (
        c: (typeof raw)[number],
        contourIndex: number,
      ): IAutoMovieRecoveryOrderedContour => {
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
        const segments: IAutoMovieRecoveryOrderedContour["segments"] = (
          c.orderedSegments ?? []
        ).map(
          (
            s: NonNullable<typeof c.orderedSegments>[number],
            i: number,
          ): IAutoMovieRecoveryOrderedContour["segments"][number] => {
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
            ): IAutoMovieRecoveryOrderedContour["points"][number] => ({
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
                        IAutoMovieRecoveryOrderedContour["points"][number]["sourceEdges"]
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
/*
 * Measure a chord between two registered observation points in mm. Math.hypot
 * limits intermediate sum overflow but is not exact arithmetic; extreme finite
 * inputs can still produce Infinity, which this helper does not independently
 * refuse. No approximation or coordinate correction occurs.
 */
function distance(
  a: Readonly<AutoMovieVector3Tuple>,
  b: Readonly<AutoMovieVector3Tuple>,
): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
