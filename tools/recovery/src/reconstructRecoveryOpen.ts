import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { tessellateAutoMovieCurveGrid64 } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieCurveGrid64.ts";
import type { RecoveryMeshSections as R } from "./RecoveryMeshSections.ts";
import type { RecoveryOpenContinuation as O } from "./RecoveryOpenContinuation.ts";
import { reconstructRecovery } from "./reconstructRecovery.ts";

/**
 * Consume saved open cubics and their explicit adjacent endpoint transport through the engine.
 * One maximal ordinary run owns its common parameter grid, shared station boundaries and
 * PCHIP station fields. Course joins and the emitted PL surface are not certified C1/G1.
 *
 * @evidence contracts/common.md#principled-implementation Complete unchanged cubic controls are reversed only by declared endpoint transport and affinely reparameterized to the engine's normalized course chart. The existing curve-grid operator generates new meshes and actual construction.
 * @evidence contracts/common.md#clear-and-simple-design The original closed-section consumer remains independent. Open runs supply additional mesh parts, per-run results and separately identified closed-only omission observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source positions, face indices, normals, positional weld, invented cap or source-specific rule is admitted. Numerical target misses and orientation warnings never delete an otherwise admissible run.
 * @evidence contracts/common.md#meaningful-documentation States maximal-run ownership, saved coefficient authority, normalized phase conversion, topology domains and unproven global continuity or embedding.
 * @evidence contracts/performance.md#efficient-algorithms Graph admission and run discovery cost O(P+A) for pairs and saved arcs. Phase-guide union costs O(K log K) per run; the existing engine bounds grid output by the explicit per-run vertex budget.
 * @evidence contracts/performance.md#reuse-equivalent-work Every saved arc belongs to one maximal ordinary run, so one engine invocation owns each supported shared course rather than tessellating adjacent pairs independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Graph maps and converted course records are call-local. Returned model and actual construction own generated buffers; no source mesh, cross-call cache or external handle exists.
 */
export function reconstructRecoveryOpen(
  bundle: R.Bundle,
  graph: O.Continuation,
): Omit<ReturnType<typeof reconstructRecovery>, "construction"> & {
  construction: { id: string; closed: boolean; points: C.Vector[] }[];
  openReports: {
    runs: {
      id: string;
      firstSection: number;
      lastSection: number;
      curves: string[];
      generated: boolean;
      reason: string | null;
      vertices: number;
      triangles: number;
      omittedZeroAreaTriangles: number;
      unresolvedVertexNormals: number;
      isolatedVertices: number;
      nonfiniteNormalSums: number;
    }[];
    pairs: number;
    unsupportedGroups: number;
    generatedRuns: number;
  };
} {
  if (
    graph.schema !== "automovie-recovery-open-continuation-v1" ||
    graph.intervals.length !== bundle.reports.length - 1 ||
    graph.orientations.length !== bundle.reports.length ||
    !(graph.resolutionMm > 0 && Number.isFinite(graph.resolutionMm)) ||
    !Number.isSafeInteger(graph.maxVerticesPerRun) ||
    graph.maxVerticesPerRun < 4
  )
    throw new Error(
      "A complete source-free open-continuation sidecar is required",
    );
  type Node = { section: number; arc: number };
  type Edge = { before: Node; after: Node; reverse: boolean };
  const key: (n: Node) => string = (n: Node): string => `${n.section}:${n.arc}`;
  const outgoing: Map<string, Edge> = new Map(),
    incoming: Map<string, Edge> = new Map();
  let pairs: number = 0,
    unsupportedGroups: number = 0;
  const address: (section: number, arc: number) => void = (
    section: number,
    arc: number,
  ): void => {
    if (
      !Number.isSafeInteger(arc) ||
      arc < 0 ||
      arc >= bundle.reports[section]!.open.length
    )
      throw new Error(
        "Open curve address does not match saved coefficient authority",
      );
  };
  for (let i: number = 0; i < graph.intervals.length; i++) {
    const interval: O.Continuation["intervals"][number] = graph.intervals[i]!;
    if (
      interval.beforeSection !== i ||
      interval.afterSection !== i + 1 ||
      graph.orientations[i]!.length !== bundle.reports[i]!.open.length
    )
      throw new Error(
        "Open continuation must address every adjacent saved section exactly",
      );
    const seen: [Set<number>, Set<number>] = [new Set(), new Set()];
    const claim: (side: 0 | 1, arc: number) => void = (
      side: 0 | 1,
      arc: number,
    ): void => {
      address(i + side, arc);
      if (seen[side].has(arc))
        throw new Error("Open adjacency records overlap");
      seen[side].add(arc);
    };
    for (const pair of interval.pairs) {
      claim(0, pair.before);
      claim(1, pair.after);
      if (typeof pair.reverseAfter !== "boolean")
        throw new Error("Endpoint reversal must be explicit");
      const edge: Edge = {
        before: { section: i, arc: pair.before },
        after: { section: i + 1, arc: pair.after },
        reverse: pair.reverseAfter,
      };
      if (outgoing.has(key(edge.before)) || incoming.has(key(edge.after)))
        throw new Error(
          "Ordinary open continuation has multiple incident strips",
        );
      outgoing.set(key(edge.before), edge);
      incoming.set(key(edge.after), edge);
      pairs++;
    }
    for (const group of interval.unresolved) {
      for (const arc of group.before) claim(0, arc);
      for (const arc of group.after) claim(1, arc);
      unsupportedGroups++;
    }
    if (
      seen[0].size !== bundle.reports[i]!.open.length ||
      seen[1].size !== bundle.reports[i + 1]!.open.length
    )
      throw new Error(
        "Open adjacency omits a saved arc rather than reporting its local uncertainty",
      );
  }
  if (
    graph.orientations.at(-1)!.length !== bundle.reports.at(-1)!.open.length ||
    graph.orientations.some((row: (1 | -1 | null)[]): boolean =>
      row.some(
        (x: 1 | -1 | null): boolean => x !== null && x !== 1 && x !== -1,
      ),
    )
  )
    throw new Error("Orientation witnesses must align with saved arcs");
  const base: ReturnType<typeof reconstructRecovery> =
    reconstructRecovery(bundle);
  const construction: ReturnType<
    typeof reconstructRecoveryOpen
  >["construction"] = [...base.construction];
  const diagnostics: string[] = [
    ...base.diagnostics,
    ...graph.diagnostics,
    "Closed-only unresolved records are preserved independently; open continuation can supply additional surfaces for those previously unrepresented observations.",
    "Open surfaces use one normalized phase chart and station PCHIP per maximal run; neither source injectivity nor global course C1/G1 or surface error is certified.",
  ];
  const openReports: ReturnType<typeof reconstructRecoveryOpen>["openReports"] =
    { runs: [], pairs, unsupportedGroups, generatedRuns: 0 };
  const normalized: (curve: C.Cubic, reverse: boolean) => C.Cubic = (
    curve: C.Cubic,
    reverse: boolean,
  ): C.Cubic => {
    if (
      curve.closed ||
      curve.unit !== "mm" ||
      curve.phaseIntervals.length !== curve.spans.length
    )
      throw new Error("Saved open cubic millimetre authority required");
    const widths: number[] = reverse
      ? [...curve.phaseIntervals].reverse()
      : [...curve.phaseIntervals];
    const total: number = widths.reduce(
      (sum: number, h: number): number => sum + h,
      0,
    );
    if (!(total > 0 && Number.isFinite(total)))
      throw new Error("Open curve phase cannot be normalized");
    let prefix: number = 0;
    const phaseIntervals: number[] = widths.map(
      (width: number, i: number): number => {
        const value: number =
          i + 1 === widths.length ? 1 - prefix : width / total;
        if (!(value > 0 && Number.isFinite(value)))
          throw new Error(
            "Normalized open phase interval is not representable",
          );
        prefix += value;
        return value;
      },
    );
    const spans: C.Span[] = reverse
      ? [...curve.spans]
          .reverse()
          .map((span: C.Span): C.Span => [span[3], span[2], span[1], span[0]])
      : [...curve.spans];
    return {
      ...curve,
      closed: false,
      phaseUnit: "normalized",
      phaseIntervals,
      spans,
    };
  };
  for (const edge of outgoing.values()) {
    if (incoming.has(key(edge.before))) continue;
    const nodes: Node[] = [edge.before];
    const reversals: boolean[] = [
      graph.orientations[edge.before.section]![edge.before.arc] === -1,
    ];
    let current: Edge | undefined = edge;
    while (current) {
      const previousReversal: boolean = reversals.at(-1)!;
      nodes.push(current.after);
      reversals.push(previousReversal !== current.reverse);
      current = outgoing.get(key(current.after));
    }
    const id: string = `recovery.open.${key(nodes[0]!)}`;
    const record: (typeof openReports.runs)[number] = {
      id,
      firstSection: nodes[0]!.section,
      lastSection: nodes.at(-1)!.section,
      curves: nodes.map(
        (n: Node): string => bundle.reports[n.section]!.open[n.arc]!.curve.name,
      ),
      generated: false,
      reason: null,
      vertices: 0,
      triangles: 0,
      omittedZeroAreaTriangles: 0,
      unresolvedVertexNormals: 0,
      isolatedVertices: 0,
      nonfiniteNormalSums: 0,
    };
    try {
      const courses: C.Cubic[] = nodes.map(
        (n: Node, i: number): C.Cubic =>
          normalized(
            bundle.reports[n.section]!.open[n.arc]!.curve,
            reversals[i]!,
          ),
      );
      const guides: Set<number> = new Set([0, 1]);
      for (const course of courses) {
        let phase: number = 0;
        for (const width of course.phaseIntervals) {
          phase += width;
          guides.add(phase);
        }
      }
      const grid: ReturnType<typeof tessellateAutoMovieCurveGrid64> =
        tessellateAutoMovieCurveGrid64({
          name: id,
          topologyDomain: id,
          stations: nodes.map(
            (n: Node): number => bundle.loft.sections[n.section]!.coordinateMm,
          ),
          courses,
          resolutionMm: graph.resolutionMm,
          guides: [...guides].sort((a: number, b: number): number => a - b),
          maxVertices: graph.maxVerticesPerRun,
        });
      base.model.parts.push({
        id,
        name: null,
        geometry: { type: "mesh", mesh: grid.mesh },
        material: null,
        attachedBone: null,
        transform: null,
      });
      for (const line of grid.construction.lines) construction.push(line);
      record.generated = true;
      record.vertices = grid.counts.vertices;
      record.triangles = grid.counts.triangles;
      record.omittedZeroAreaTriangles = grid.counts.omittedZeroAreaTriangles;
      openReports.generatedRuns++;
      record.unresolvedVertexNormals = grid.counts.unresolvedVertexNormals;
      record.isolatedVertices = grid.counts.isolatedVertices;
      record.nonfiniteNormalSums = grid.counts.nonfiniteNormalSums;
      if (record.unresolvedVertexNormals)
        diagnostics.push(
          `${id}: ${record.unresolvedVertexNormals} vertex normals remain unqualified, including ${record.isolatedVertices} isolated vertices and ${record.nonfiniteNormalSums} nonfinite normal sums; finite geometry remains displayed`,
        );
      for (let i: number = 0; i < nodes.length; i++) {
        const n: Node = nodes[i]!,
          sign: 1 | -1 | null = graph.orientations[n.section]![n.arc]!;
        if (sign === null || sign < 0 !== reversals[i])
          diagnostics.push(
            `${id}: source material orientation is unqualified at saved open arc ${key(n)}; geometry remains displayed`,
          );
      }
    } catch (failure: unknown) {
      record.reason =
        failure instanceof Error ? failure.message : String(failure);
      diagnostics.push(`${id}: open grid unresolved: ${record.reason}`);
    }
    openReports.runs.push(record);
  }
  return { ...base, construction, diagnostics, openReports };
}
