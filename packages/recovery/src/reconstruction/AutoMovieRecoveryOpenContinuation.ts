import type {
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieMeshCriticalPoints,
  IAutoMovieMeshPlaneCut,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryIndexedMesh,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryOpenContinuationRow,
  IAutoMovieRecoveryOpenSlabGraph,
  IAutoMovieRecoveryScalarIndex,
} from "@automovie/interface";

import { RecoveryOpenSlabGraph as O } from "../internal/RecoveryOpenSlabGraph";
import { RecoveryScalarIndex as S } from "../internal/RecoveryScalarIndex";
import { critical } from "../geometry/internal/critical";
import { cutExact } from "../internal/mesh-observations/cutExact";
import { planeFrame } from "../geometry/internal/planeFrame";
import { prepareRecoveryOpenSlabGraph as prepareSlabGraphImplementation } from "./internal/prepareRecoveryOpenSlabGraph";

/**
 * Source observation of open-curve continuation without repeating numerical
 * fitting.
 */
export namespace AutoMovieRecoveryOpenContinuation {
  /**
   * Reobserve automatically saved stations, preserving their complete cubic
   * coefficients. The command caller must bind both the fixed source bytes and
   * the original bundle hash.
   */
  export function observe(
    input: IAutoMovieRecoveryInput,
    bundle: IAutoMovieRecoveryMeshSections,
    progress?: (completed: number, total: number) => void,
  ): IAutoMovieRecoveryOpenContinuation {
    if (
      bundle.reports.length !== bundle.loft.sections.length ||
      bundle.loft.sections.length < 2
    )
      throw new Error("Aligned saved section observations are required");
    const inputFields: Record<string, unknown> = { ...input };
    for (const [key, value] of Object.entries(bundle.policy))
      if (JSON.stringify(value) !== JSON.stringify(inputFields[key]))
        throw new Error(
          "Saved fitting and station policy must remain unchanged",
        );
    const vertices: IAutoMovieRecoveryInput["verticesMm"] = input.verticesMm;
    const aliases: Map<string, number> = new Map();
    const canon: Int32Array = Int32Array.from(
      vertices.map((p: Readonly<AutoMovieVector3Tuple>, i: number): number => {
        if (!input.exactCoordinateAliases) return i;
        const key: string = JSON.stringify(p);
        if (!aliases.has(key)) aliases.set(key, i);
        return aliases.get(key)!;
      }),
    );
    const mesh: IAutoMovieRecoveryIndexedMesh = {
      vertices,
      triangles: input.triangles,
      canon,
    };
    const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
      planeFrame([0, 0, 0], input.axis, input.reference);
    const heights: number[] = vertices.map(
      (p: Readonly<AutoMovieVector3Tuple>): number =>
        p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2],
    );
    const index: ReturnType<IAutoMovieRecoveryScalarIndex.Create> = S.create(
      mesh.triangles,
      heights,
    );
    const slice: ReturnType<IAutoMovieMeshPlaneCut.Prepare> = cutExact.prepare(
      mesh,
      heights,
    );
    const open: ReturnType<IAutoMovieRecoveryOpenSlabGraph.Prepare> = O.prepare(
      {
        vertices,
        triangles: mesh.triangles,
        canon,
        heights,
      },
    );
    const edgeFaces: Map<string, Set<number>> = new Map(),
      vertexFaces: Map<number, Set<number>> = new Map();
    const edgeKey: (a: number, b: number) => string = (
      a: number,
      b: number,
    ): string => (a < b ? `${a},${b}` : `${b},${a}`);
    mesh.triangles.forEach(
      (
        triangle: IAutoMovieRecoveryInput["triangles"][number],
        ti: number,
      ): void => {
        for (let k: number = 0; k < 3; k++) {
          const a: number = canon[triangle[k]!]!,
            b: number = canon[triangle[(k + 1) % 3]!]!;
          const key: string = edgeKey(a, b);
          if (!edgeFaces.has(key)) edgeFaces.set(key, new Set());
          edgeFaces.get(key)!.add(ti);
          if (!vertexFaces.has(a)) vertexFaces.set(a, new Set());
          vertexFaces.get(a)!.add(ti);
        }
      },
    );
    const events: ReturnType<IAutoMovieMeshCriticalPoints.Operation> = critical(
      mesh,
      frame.n,
      heights,
      "boundary-regular-path-v1",
    );
    const output: IAutoMovieRecoveryOpenContinuation = {
      criticalPolicy: "boundary-regular-path-v1",
      intervals: [],
      orientations: [],
      diagnostics: [
        "Unresolved open-observation groups include components with no open boundary arcs; closed-section surfaces are generated independently. These counts are not a count of remaining whole-model holes.",
      ],
      resolutionMm: input.chordToleranceMm,
      maxVerticesPerRun: 2_000_000,
    };
    let previous: IAutoMovieRecoveryOpenContinuationRow | undefined,
      eventCursor: number = 0;
    for (let i: number = 0; i < bundle.loft.sections.length; i++) {
      const level: number = bundle.loft.sections[i]!.coordinateMm;
      if (
        bundle.reports[i]!.coordinateMm !== level ||
        (i > 0 && !(level > bundle.loft.sections[i - 1]!.coordinateMm))
      )
        throw new Error("Increasing aligned saved stations required");
      const plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> = {
        ...frame,
        origin: [frame.n[0] * level, frame.n[1] * level, frame.n[2] * level],
      };
      const contours: ReturnType<IAutoMovieMeshPlaneCut.Operation> = slice(
        plane,
        level,
        index.cut(level),
      );
      const saved: Map<string, number> = new Map(
        bundle.reports[i]!.open.map(
          (
            fit: (typeof bundle.reports)[number]["open"][number],
            j: number,
          ): [string, number] => [fit.curve.name, j],
        ),
      );
      const row: IAutoMovieRecoveryOpenContinuationRow = {
        arcs: [],
        ordinals: [],
        missing: [],
        defects: [],
      };
      const signs: (1 | -1 | null)[] = bundle.reports[i]!.open.map(
        (): null => null,
      );
      const found: Set<number> = new Set();
      for (let ci: number = 0; ci < contours.length; ci++) {
        const contour: (typeof contours)[number] = contours[ci]!;
        const pointFaces: Set<number>[] = contour.pts.map(
          (p: (typeof contour.pts)[number]): Set<number> =>
            p.a === p.b
              ? (vertexFaces.get(p.a) ?? new Set())
              : (edgeFaces.get(edgeKey(p.a, p.b)) ?? new Set()),
        );
        const support: Set<number> = new Set();
        for (const faces of pointFaces)
          for (const face of faces) support.add(face);
        const ordinal: number | undefined = saved.get(
          `section.${level}.contour.${ci}`,
        );
        if (contour.closed || contour.pts.length < 2 || ordinal === undefined) {
          row.defects.push(support);
          continue;
        }
        const curve: IAutoMovieCubicBezierCurve64 =
          bundle.reports[i]!.open[ordinal]!.curve;
        const first: Readonly<AutoMovieVector3Tuple> = curve.spans[0]![0],
          last: Readonly<AutoMovieVector3Tuple> = curve.spans.at(-1)![3];
        if (
          !first.every(
            (x: number, k: number): boolean => x === contour.pts[0]!.p[k],
          ) ||
          !last.every(
            (x: number, k: number): boolean => x === contour.pts.at(-1)!.p[k],
          )
        ) {
          row.defects.push(support);
          continue;
        }
        found.add(ordinal);
        row.ordinals.push(ordinal);
        row.arcs.push({
          faces: support,
          ends: [
            { a: contour.pts[0]!.a, b: contour.pts[0]!.b },
            { a: contour.pts.at(-1)!.a, b: contour.pts.at(-1)!.b },
          ],
        });
        for (
          let k: number = 1;
          k < contour.pts.length && signs[ordinal] === null;
          k++
        ) {
          const ti: number | undefined = [...pointFaces[k - 1]!].find(
            (face: number): boolean => pointFaces[k]!.has(face),
          );
          if (ti === undefined) continue;
          const triangle: IAutoMovieRecoveryInput["triangles"][number] =
            mesh.triangles[ti]!;
          const a: Readonly<AutoMovieVector3Tuple> = vertices[triangle[0]]!,
            b: Readonly<AutoMovieVector3Tuple> = vertices[triangle[1]]!,
            c: Readonly<AutoMovieVector3Tuple> = vertices[triangle[2]]!;
          const u: number[] = b.map(
              (x: number, j: number): number => x - a[j]!,
            ),
            v: number[] = c.map((x: number, j: number): number => x - a[j]!);
          const n: number[] = [
            u[1]! * v[2]! - u[2]! * v[1]!,
            u[2]! * v[0]! - u[0]! * v[2]!,
            u[0]! * v[1]! - u[1]! * v[0]!,
          ];
          const t: number[] = [
            frame.n[1] * n[2]! - frame.n[2] * n[1]!,
            frame.n[2] * n[0]! - frame.n[0] * n[2]!,
            frame.n[0] * n[1]! - frame.n[1] * n[0]!,
          ];
          const sense: number =
            contour.pts[k]!.p.reduce(
              (sum: number, x: number, j: number): number =>
                sum + (x - contour.pts[k - 1]!.p[j]!) * t[j]!,
              0,
            ) * input.sourceOrientationSign;
          // Only a resolved side, positive or negative, orients the arc.
          if (sense > 0 && sense !== Infinity) signs[ordinal] = 1;
          else if (sense < 0 && sense !== -Infinity) signs[ordinal] = -1;
        }
      }
      for (let j: number = 0; j < bundle.reports[i]!.open.length; j++)
        if (!found.has(j)) row.missing.push(j);
      output.orientations.push(signs);
      if (previous) {
        const beforeMm: number = bundle.loft.sections[i - 1]!.coordinateMm;
        const defects: Set<number>[] = [...previous.defects, ...row.defects];
        while (
          eventCursor < events.length &&
          events[eventCursor]!.level < beforeMm
        )
          eventCursor++;
        for (
          let j: number = eventCursor;
          j < events.length && events[j]!.level <= level;
          j++
        )
          defects.push(vertexFaces.get(events[j]!.vertex) ?? new Set());
        const observed: IAutoMovieRecoveryOpenSlabGraph.Result = open({
          beforeMm,
          afterMm: level,
          before: previous.arcs,
          after: row.arcs,
          defects,
          candidates: index.slab(beforeMm, level),
        });
        const interval: IAutoMovieRecoveryOpenContinuation["intervals"][number] =
          {
            beforeSection: i - 1,
            afterSection: i,
            pairs: observed.pairs.map(
              (
                pair: IAutoMovieRecoveryOpenSlabGraph.Result["pairs"][number],
              ): IAutoMovieRecoveryOpenSlabGraph.Result["pairs"][number] => ({
                before: previous!.ordinals[pair.before]!,
                after: row.ordinals[pair.after]!,
                reverseAfter: pair.reverseAfter,
              }),
            ),
            unresolved: observed.unresolved.map(
              (
                group: IAutoMovieRecoveryOpenSlabGraph.Result["unresolved"][number],
              ): IAutoMovieRecoveryOpenSlabGraph.Result["unresolved"][number] => ({
                before: group.before.map(
                  (j: number): number => previous!.ordinals[j]!,
                ),
                after: group.after.map((j: number): number => row.ordinals[j]!),
                reason: group.reason,
              }),
            ),
          };
        if (previous.missing.length || row.missing.length)
          interval.unresolved.push({
            before: previous.missing,
            after: row.missing,
            reason:
              "Saved open coefficients have no identical endpoint-bound source observation",
          });
        output.intervals.push(interval);
        for (const diagnostic of observed.diagnostics ?? [])
          output.diagnostics.push(diagnostic);
      }
      previous = row;
      if (i % 64 === 0 || i + 1 === bundle.loft.sections.length)
        progress?.(i + 1, bundle.loft.sections.length);
    }
    return output;
  }
  /** Prepare source-backed open-slab transport queries for continuation observation. */
  export function prepareSlabGraph(
    source: IAutoMovieRecoveryOpenSlabGraph.Source,
  ): IAutoMovieRecoveryOpenSlabGraph.Prepare {
    return prepareSlabGraphImplementation(source);
  }
}
