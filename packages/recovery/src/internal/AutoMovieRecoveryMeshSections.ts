import {
  IAutoMovieCurve64 as C,
  IAutoMovieContourLoft64 as L,
} from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryMeshSections } from "./IAutoMovieRecoveryMeshSections";
import { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import { RecoveryScalarIndex as S } from "./RecoveryScalarIndex";
import { RecoverySlabGraph as G } from "./RecoverySlabGraph";
import { createRecoveryObservationPolicy } from "./createRecoveryObservationPolicy";
import { critical } from "./mesh-observations/critical";
import { cutExact } from "./mesh-observations/cutExact";
import { planeFrame } from "./mesh-observations/planeFrame";
import { signedArea } from "./mesh-observations/signedArea";
import { sourceOrientation } from "./mesh-observations/sourceOrientation";
import { prepareRecoveryCriticalBrackets } from "./prepareRecoveryCriticalBrackets";
import { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/**
 * Automatic section extraction and source-independent cubic publication.
 *
 * @evidence contracts/common.md#principled-implementation Existing triangle-plane cuts and PL link classification derive stations and topology; adaptive fitting publishes only physical coefficients and named incidence.
 * @evidence contracts/common.md#clear-and-simple-design Source mesh addresses live only in the observation call; the result cannot supply them to reconstruction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every component is retained, open arcs stay open and no person-specific plane or control table is accepted.
 * @evidence contracts/common.md#meaningful-documentation Inputs and results distinguish physical registration, exact coordinate aliases, open gaps and unsupported events.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace performs no extraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No persistent resources exist.
 */
export namespace AutoMovieRecoveryMeshSections {
  /**
   * Immutable registered observations and automatic section policy.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed input preserves source positions, original incidence and declared millimetre policy.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Input = IAutoMovieRecoveryMeshSections.Input;
  /**
   * Source-free saved coefficients, continuation evidence and coverage accounting.
   *
   * @evidence contracts/common.md#principled-implementation The borrowed bundle publishes fitted curves and named relationships while keeping source mesh arrays private.
   * @evidence contracts/common.md#clear-and-simple-design The existing public alias borrows the type-only owner without duplicating its structural declaration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no defaults, validation bypass or geometric transformation.
   * @evidence contracts/common.md#meaningful-documentation The type owner documents physical units, input premises and returned ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased alias coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime lifetimes remain with the original operation and its caller.
   */
  export type Bundle = IAutoMovieRecoveryMeshSections.Bundle;

  /**
   * Extract every section component with automatic stations, feature corners and PL critical brackets.
   * Physical ties remain explicit; cutting and PL topology share one immutable scalar chart.
   * The optional progress observer reports completed plane and slab populations without changing geometry.
   * An explicit sectionLimit publishes an incomplete sorted-station prefix; coverage records the full omission.
   *
   * @evidence contracts/common.md#principled-implementation Regular stations derive from projected bounds; lower/upper PL links add physical critical brackets and exact incident edge support. Source-face witnesses preserve cavity winding before source addresses are discarded.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the existing cut, critical, orientation and plane operators instead of adding a second mesh engine. A per-level observation cache supplies both event incidence and fitting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every component at each retained station survives. An explicit computational prefix reports all omitted stations and source range; it never changes the station/fit policy or closes its terminal cut. No largest-loop selection, invented closure, source control table or source normal field enters reconstruction.
   * @evidence contracts/common.md#meaningful-documentation States automatic physical levels, source orientation witnesses, exact positional alias limitations, finite-polyline scope and incomplete prefix coverage.
   * @evidence contracts/performance.md#efficient-algorithms For V vertices, T triangles, K cuts and P observations, preparation costs O(V+T log T), PL links cost O(T) plus local traversals, interval queries prune disjoint face bounds and sort matching face IDs, and cutting/slab graphs traverse only their candidates; fitting owns its adaptive cost. Worst-case all faces remain candidates; memory is O(V+T+P).
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable source admission, signed scalar samples and triangle height bounds are prepared once. Each exact plane is cut once; its source supports are reused for event incidence and discarded after coefficient publication.
   * @evidence contracts/performance.md#bound-retention-and-release-resources maxSections and maxSpans bound generated populations; transient adjacency, raw cut points and source supports expire on return or failure.
   */
  export function extract(
    input: Input,
    progress?: (phase: string, completed: number, total: number) => void,
    sectionLimit?: number,
  ): Bundle {
    if (
      sectionLimit !== undefined &&
      (!Number.isSafeInteger(sectionLimit) || sectionLimit < 2)
    )
      throw new Error("A checkpoint needs at least two automatic stations");
    if (
      !(input.stepMm > 0 && Number.isFinite(input.stepMm)) ||
      !(input.cornerDegrees > 0 && input.cornerDegrees < 180) ||
      !Number.isSafeInteger(input.maxSections) ||
      input.maxSections < 2 ||
      (input.sourceOrientationSign !== 1 && input.sourceOrientationSign !== -1)
    )
      throw new Error("Invalid automatic section policy");
    const frame: ReturnType<typeof planeFrame> = planeFrame(
      [0, 0, 0],
      input.axis,
      input.reference,
    );
    const vertices: typeof input.verticesMm = input.verticesMm;
    if (
      !vertices.length ||
      vertices.some(
        (p: C.Vector): boolean => p.length !== 3 || !p.every(Number.isFinite),
      )
    )
      throw new Error("Finite physical mesh positions required");
    if (
      !input.triangles.length ||
      input.triangles.some(
        (t: number[]): boolean =>
          t.length !== 3 ||
          t.some(
            (i: number): boolean =>
              !Number.isSafeInteger(i) || i < 0 || i >= vertices.length,
          ),
      )
    )
      throw new Error("Valid source triangle addresses required");
    const {
      aliases,
      canon,
      mesh,
      faceEdges,
      vertexFaces,
      edgeKey,
    }: ReturnType<typeof prepareRecoveryMeshIncidence> =
      prepareRecoveryMeshIncidence(input, vertices);
    const project: (p: C.Vector) => number = (p: C.Vector): number =>
      p[0] * frame.n[0] + p[1] * frame.n[1] + p[2] * frame.n[2];
    const scalarHeights: number[] = vertices.map(project);
    const scalarIndex: ReturnType<typeof S.create> = S.create(
      mesh.triangles,
      scalarHeights,
    );
    const slice: ReturnType<typeof cutExact.prepare> = cutExact.prepare(
      mesh,
      scalarHeights,
    );
    const observe: ReturnType<typeof G.prepare> = G.prepare({
      triangles: mesh.triangles,
      canon,
      heights: scalarHeights,
    });
    const heights: number[] = [...new Set(scalarHeights)].sort(
      (a: number, b: number): number => a - b,
    );
    const low: number = heights[0]!,
      high: number = heights[heights.length - 1]!;
    if (!(high > low) || !Number.isFinite(high - low))
      throw new Error("Mesh sweep has no representable physical extent");
    if (Math.ceil((high - low) / input.stepMm) > input.maxSections)
      throw new Error("Nominal station budget exhausted");
    const levels: Set<number> = new Set();
    const offset: number = Math.min(input.stepMm / 4, (high - low) / 1000);
    levels.add(low - offset);
    levels.add(high + offset);
    for (let k: number = 0; low + (k + 0.5) * input.stepMm < high; k++) {
      levels.add(low + (k + 0.5) * input.stepMm);
      if (levels.size > input.maxSections)
        throw new Error("Automatic station budget exhausted");
    }
    const diagnostics: string[] = [
      "Cut convention: unmodified binary64 signed distances; exact-zero vertices and coplanar patch boundaries are retained. Signs and intersections are not certified predicates.",
      "Exact positional aliases can join touching components; they establish incidence only and displace no positions.",
      "Face orientation follows the registered material-side sign; mixed shells are not silently repaired.",
      "Within-section estimates do not bound between-section surfaces or certify source embedding.",
    ];
    const topologyGaps: Bundle["topologyGaps"] = [];
    const criticals: ReturnType<typeof critical> = critical(
      mesh,
      frame.n,
      scalarHeights,
      input.criticalPolicy,
    );
    const {
      unsupportedVertices,
      bracketed,
    }: ReturnType<typeof prepareRecoveryCriticalBrackets> =
      prepareRecoveryCriticalBrackets(
        criticals,
        heights,
        input.stepMm,
        levels,
        diagnostics,
        topologyGaps,
      );
    if (levels.size > input.maxSections)
      throw new Error("Critical section budget exhausted");
    const orientation: ReturnType<typeof sourceOrientation> = sourceOrientation(
      mesh,
      input.sourceOrientationSign,
    );
    const cache: Map<
      number,
      {
        section: L.ISection;
        report: Bundle["reports"][number];
        supports: Set<number>[];
        faces: Set<number>[];
        defects: Set<number>[];
      }
    > = new Map();
    let observations: number = 0,
      spans: number = 0;
    const plannedLevels: number[] = [...levels].sort(
      (a: number, b: number): number => a - b,
    );
    const retainedLevels: number[] =
      sectionLimit === undefined
        ? plannedLevels
        : plannedLevels.slice(0, sectionLimit);
    progress?.("sections", 0, retainedLevels.length);
    for (const coordinateMm of retainedLevels) {
      const plane: ReturnType<typeof planeFrame> = {
        ...frame,
        origin: frame.n.map((x: number): number => x * coordinateMm) as [
          number,
          number,
          number,
        ],
      };
      const contours: ReturnType<typeof slice> = slice(
        plane,
        coordinateMm,
        scalarIndex.cut(coordinateMm),
      );
      const section: L.ISection = { coordinateMm, loops: [] };
      const report: Bundle["reports"][number] = {
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
          const incident: Set<number> | undefined =
            point.a === point.b
              ? vertexFaces.get(point.a)
              : faceEdges.get(edgeKey(point.a, point.b));
          if (incident) for (const ti of incident) faceSupport.add(ti);
        }
        try {
          let points: [number, number, number][] = contour.pts.map(
            (p: (typeof contour.pts)[number]): [number, number, number] => [
              ...p.p,
            ],
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
            const a: C.Vector =
                points[(i + points.length - 1) % points.length]!,
              b: C.Vector = points[i]!,
              c: C.Vector = points[(i + 1) % points.length]!;
            const u: number[] = b.map(
                (x: number, k: number): number => x - a[k]!,
              ),
              v: number[] = c.map((x: number, k: number): number => x - b[k]!);
            const cosine: number =
              u.reduce(
                (s: number, x: number, k: number): number => s + x * v[k]!,
                0,
              ) /
              (Math.hypot(...u) * Math.hypot(...v));
            if (
              (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI >=
              input.cornerDegrees
            )
              corners.push(i);
          }
          const fit: F.Result = F.fit({
            name: `section.${coordinateMm}.contour.${ci}`,
            pointsMm: points,
            closed: contour.closed,
            corners,
            toleranceMm: input.toleranceMm,
            maxSpans: input.maxSpans,
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
                contour.pts.flatMap(
                  (p: (typeof contour.pts)[number]): number[] => [p.a, p.b],
                ),
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
      cache.set(coordinateMm, { section, report, supports, faces, defects });
      if (cache.size % 64 === 0 || cache.size === retainedLevels.length)
        progress?.("sections", cache.size, retainedLevels.length);
    }
    const events: L.IEvent[] = bracketed.map(
      (
        { event, before, after }: (typeof bracketed)[number],
        i: number,
      ): L.IEvent => ({
        name: `critical.${i}`,
        coordinateMm: event.level,
        beforeMm: before,
        afterMm: after,
        before:
          cache
            .get(before)
            ?.supports.flatMap((s: Set<number>, k: number): number[] =>
              s.has(event.vertex) ? [k] : [],
            ) ?? [],
        after:
          cache
            .get(after)
            ?.supports.flatMap((s: Set<number>, k: number): number[] =>
              s.has(event.vertex) ? [k] : [],
            ) ?? [],
        kind:
          event.lower === 0
            ? "minimum"
            : event.upper === 0
              ? "maximum"
              : "saddle",
        regular:
          event.manifold &&
          !event.flat &&
          ((event.lower === 0 && event.upper === 1) ||
            (event.lower === 1 && event.upper === 0) ||
            (event.lower === 2 && event.upper === 2)),
        terminal: event.lower === 0 || event.upper === 0 ? event.p : null,
      }),
    );
    const declaredEvents: L.IEvent[] = [];
    const unconsumedEvents: Bundle["unconsumedEvents"] = [];
    for (const event of events) {
      if (!cache.has(event.beforeMm) || !cache.has(event.afterMm))
        unconsumedEvents.push({
          event,
          reason:
            "Incomplete station-prefix checkpoint has not observed both event cuts",
        });
      else if (event.before.length + event.after.length > 0)
        declaredEvents.push(event);
      else
        unconsumedEvents.push({
          event,
          reason:
            "Source critical event has no displayable incident closed curve; its preimage remains unsupported",
        });
    }
    const entries: (typeof cache extends Map<number, infer T> ? T : never)[] = [
      ...cache.values(),
    ];
    const intervals: NonNullable<L["intervals"]>[number][] = [];
    progress?.("slabs", 0, entries.length - 1);
    for (let i: number = 1; i < entries.length; i++) {
      const before: (typeof entries)[number] = entries[i - 1]!,
        after: (typeof entries)[number] = entries[i]!;
      const defects: Set<number>[] = [...before.defects, ...after.defects];
      for (const event of criticals)
        if (
          unsupportedVertices.has(event.vertex) &&
          event.level >= before.section.coordinateMm &&
          event.level <= after.section.coordinateMm
        )
          defects.push(vertexFaces.get(event.vertex) ?? new Set());
      const groups: G.Group[] = observe({
        beforeMm: before.section.coordinateMm,
        afterMm: after.section.coordinateMm,
        before: before.faces,
        after: after.faces,
        defects,
        candidates: scalarIndex.slab(
          before.section.coordinateMm,
          after.section.coordinateMm,
        ),
      });
      intervals.push({
        beforeMm: before.section.coordinateMm,
        afterMm: after.section.coordinateMm,
        groups,
      });
      if (i % 64 === 0 || i === entries.length - 1)
        progress?.("slabs", i, entries.length - 1);
    }
    const policy: Bundle["policy"] = createRecoveryObservationPolicy(input);
    const coverage: Bundle["coverage"] =
      sectionLimit === undefined
        ? undefined
        : {
            complete: false,
            plannedSections: plannedLevels.length,
            retainedSections: retainedLevels.length,
            sourceRangeMm: [low, high],
            observedStationRangeMm: [
              retainedLevels[0]!,
              retainedLevels[retainedLevels.length - 1]!,
            ],
            unobservedStationRangeMm:
              retainedLevels.length < plannedLevels.length
                ? [
                    plannedLevels[retainedLevels.length]!,
                    plannedLevels[plannedLevels.length - 1]!,
                  ]
                : null,
            missingSourceRangeMm:
              retainedLevels[retainedLevels.length - 1]! < high
                ? [
                    Math.max(low, retainedLevels[retainedLevels.length - 1]!),
                    high,
                  ]
                : null,
          };
    if (coverage)
      diagnostics.push(
        "Incomplete computational station-prefix checkpoint: all unobserved source ranges remain missing; no terminal closure is authorized",
      );
    return {
      schema: "automovie-recovery-curves-v1",
      loft: {
        sections: entries.map(
          (s: (typeof entries)[number]): L.ISection => s.section,
        ),
        events: declaredEvents,
        intervals,
        chordToleranceMm: input.chordToleranceMm,
      },
      reports: entries.map(
        (s: (typeof entries)[number]): Bundle["reports"][number] => s.report,
      ),
      diagnostics,
      topologyGaps,
      unconsumedEvents,
      policy,
      summary: {
        observations,
        spans,
        sections: cache.size,
        events: events.length,
        aliases: input.exactCoordinateAliases
          ? vertices.length - aliases.size
          : 0,
      },
      ...(coverage ? { coverage } : {}),
    };
  }
}
