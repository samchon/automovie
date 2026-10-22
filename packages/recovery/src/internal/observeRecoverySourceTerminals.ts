import type { IAutoMovieRecoverySourceTerminal } from "../structures/mesh/IAutoMovieRecoverySourceTerminal";
import { RecoverySlabGraph } from "./RecoverySlabGraph";
import { critical } from "./mesh-observations/critical";
import { prepareRecoveryCriticalBrackets } from "./prepareRecoveryCriticalBrackets";
import type { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/**
 * Observe actual distal extrema and PL critical brackets from existing source-loop incidence. The open half-space is bounded above by the next representable value beyond the source maximum. Private vertex-face probes let the existing slab graph identify exactly the seeded indexed-source component; original point positions are published only as measured extrema and critical event observations. A one-tip result requires unique incidence, two-use original edges, one nonflat manifold maximum and no other critical event; branch and plateau observations remain explicit.
 *
 * @evidence contracts/common.md#principled-implementation Existing clipped-slab connectivity, original incidence and PL lower/upper links establish source component and event relations without proximity matching. The half-space bound changes no source coordinate; event brackets reuse the maintained physical-height owner.
 * @evidence contracts/common.md#clear-and-simple-design One acquisition helper reuses prepared source incidence and publishes source-free terminal measurements; cutting and coefficient fitting remain with the fixed-section observer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No semantic part choice, maximum-loop choice, coordinate clamping, source surface fallback or inferred closure is introduced; all tied extrema and unsupported critical relations remain visible.
 * @evidence contracts/common.md#meaningful-documentation States increasing-coordinate half-space, probe ownership, actual-extremum meaning, one-tip premises and the distinction between observed critical brackets and generated caps.
 * @evidence contracts/performance.md#efficient-algorithms For V source vertices, T faces, E critical events and R seeds, one PL classification and height sorting cost O(V log V+T+E log E). Each seed uses O(V+T) probes and clipped connectivity plus one source-edge scan. For e selected events, the existing bracket owner and bracket lookup can cost O(e squared+e log V); transient storage is O(V+T+E) apart from returned events.
 * @evidence contracts/performance.md#reuse-equivalent-work One critical classification, sorted physical-height set and admitted slab-graph closure serve every seed on the same immutable source chart.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared source references belong to the calling synchronous observation; per-seed supports and connectivity expire after measurements are copied. No source arrays or private addresses enter the returned terminal records.
 */
export function observeRecoverySourceTerminals(input: {
  prepared: ReturnType<typeof prepareRecoveryMeshIncidence>;
  heights: readonly number[];
  axis: [number, number, number];
  seeds: readonly {
    coordinateMm: number;
    loopIndex: number;
    curveName: string;
    faces: ReadonlySet<number>;
  }[];
  checkpoint?: () => void;
}): IAutoMovieRecoverySourceTerminal[] {
  if (!input.seeds.length) return [];
  const { prepared, heights }: typeof input = input;
  const uniqueHeights: number[] = [...new Set(heights)].sort(
    (a: number, b: number): number => a - b,
  );
  const low: number = uniqueHeights[0]!,
    high: number = uniqueHeights[uniqueHeights.length - 1]!;
  if (!(high > low && Number.isFinite(high - low)))
    throw new Error(
      "Terminal observation needs a finite source projection range",
    );
  const next: DataView = new DataView(new ArrayBuffer(8));
  next.setFloat64(0, high);
  next.setBigUint64(0, next.getBigUint64(0) + (high >= 0 ? 1n : -1n));
  const upper: number = high === 0 ? Number.MIN_VALUE : next.getFloat64(0);
  if (!(upper > high && Number.isFinite(upper)))
    throw new Error("Source maximum has no finite larger half-space bound");
  const events: ReturnType<typeof critical> = critical(
    prepared.mesh,
    input.axis,
    heights,
    "boundary-regular-path-v1",
  );
  const graph: ReturnType<typeof RecoverySlabGraph.prepare> =
    RecoverySlabGraph.prepare({
      triangles: prepared.mesh.triangles,
      canon: prepared.canon,
      heights,
    });
  const results: IAutoMovieRecoverySourceTerminal[] = [];
  for (const seed of input.seeds) {
    input.checkpoint?.();
    const record: IAutoMovieRecoverySourceTerminal = {
      seed: {
        coordinateMm: seed.coordinateMm,
        loopIndex: seed.loopIndex,
        curveName: seed.curveName,
      },
      singleTipQualified: false,
      maximum: null,
      events: [],
      coordinatesMm: [],
      diagnostics: [],
    };
    results.push(record);
    if (!(seed.coordinateMm < high)) {
      record.diagnostics.push(
        "Seed has no source projection strictly beyond its plane",
      );
      continue;
    }
    const vertices: number[] = [];
    const probes: ReadonlySet<number>[] = [];
    for (const [vertex, faces] of prepared.vertexFaces)
      if (heights[vertex]! > seed.coordinateMm) {
        vertices.push(vertex);
        probes.push(faces);
      }
    const groups: RecoverySlabGraph.Group[] = graph({
      beforeMm: seed.coordinateMm,
      afterMm: upper,
      before: [seed.faces],
      after: [],
      defects: [],
      probes,
    });
    const incident: RecoverySlabGraph.Group[] = groups.filter(
      (group: RecoverySlabGraph.Group): boolean => group.before.includes(0),
    );
    if (incident.length !== 1 || !incident[0]!.supported) {
      record.diagnostics.push(
        "Seed has no unique supported clipped distal source component",
        ...incident.flatMap((group: RecoverySlabGraph.Group): string[] =>
          group.reason ? [group.reason] : [],
        ),
      );
      continue;
    }
    const component: Set<number> = new Set(
      (incident[0]!.probes ?? []).map((i: number): number => vertices[i]!),
    );
    if (!component.size) {
      record.diagnostics.push(
        "Seeded distal component has no strictly distal source vertices",
      );
      continue;
    }
    let maximum: number = -Infinity;
    for (const vertex of component)
      maximum = Math.max(maximum, heights[vertex]!);
    const maxima: number[] = [...component].filter(
      (vertex: number): boolean => heights[vertex] === maximum,
    );
    record.maximum = {
      coordinateMm: maximum,
      pointsMm: maxima.map((vertex: number): [number, number, number] => [
        ...prepared.mesh.vertices[vertex]!,
      ]),
    };
    let boundaryEdges: number = 0;
    for (const [key, faces] of prepared.faceEdges) {
      const ends: number[] = key.split(",").map(Number);
      if (
        ends.some(
          (vertex: number): boolean =>
            component.has(vertex) && heights[vertex]! > seed.coordinateMm,
        ) &&
        faces.size !== 2
      )
        boundaryEdges++;
    }
    if (boundaryEdges)
      record.diagnostics.push(
        `Distal source component has ${boundaryEdges} boundary or nonmanifold original edges`,
      );
    const selected: ReturnType<typeof critical> = events.filter(
      (event: ReturnType<typeof critical>[number]): boolean =>
        component.has(event.vertex),
    );
    const levels: Set<number> = new Set();
    const gaps: Parameters<typeof prepareRecoveryCriticalBrackets>[5] = [];
    const bracketed: ReturnType<typeof prepareRecoveryCriticalBrackets> =
      prepareRecoveryCriticalBrackets(
        selected,
        uniqueHeights,
        high - low,
        levels,
        record.diagnostics,
        gaps,
      );
    for (let i: number = 0; i < selected.length; i++) {
      const event: (typeof selected)[number] = selected[i]!;
      const bracket: (typeof bracketed.bracketed)[number] | undefined =
        bracketed.bracketed.find(
          (candidate: (typeof bracketed.bracketed)[number]): boolean =>
            candidate.event === event,
        );
      const regular: boolean =
        !bracketed.unsupportedVertices.has(event.vertex) &&
        event.manifold &&
        !event.flat &&
        ((event.lower === 0 && event.upper === 1) ||
          (event.lower === 1 && event.upper === 0) ||
          (event.lower === 2 && event.upper === 2));
      record.events.push({
        name: `source-critical.${i}`,
        coordinateMm: event.level,
        pointMm: [...event.p],
        lowerComponents: event.lower,
        upperComponents: event.upper,
        manifold: event.manifold,
        flat: event.flat,
        regular,
        beforeMm: bracket?.before ?? null,
        afterMm: bracket?.after ?? null,
      });
      levels.add(event.level);
    }
    record.coordinatesMm = [...levels]
      .filter((coordinate: number): boolean => coordinate > seed.coordinateMm)
      .sort((a: number, b: number): number => a - b);
    const terminal:
      | IAutoMovieRecoverySourceTerminal["events"][number]
      | undefined = record.events.find(
      (event: IAutoMovieRecoverySourceTerminal["events"][number]): boolean =>
        event.coordinateMm === maximum &&
        event.lowerComponents === 1 &&
        event.upperComponents === 0 &&
        event.regular,
    );
    record.singleTipQualified =
      boundaryEdges === 0 &&
      maxima.length === 1 &&
      record.events.length === 1 &&
      terminal !== undefined;
    if (!record.singleTipQualified)
      record.diagnostics.push(
        "A single point cap is not qualified: preserve the observed extrema, branches, plateaus and unresolved source links",
      );
  }
  return results;
}
