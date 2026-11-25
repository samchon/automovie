import type {
  IAutoMovieOpenSolidMeshResult,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

import { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";

/** A directed boundary occurrence in an explicit native cover. */
interface Edge extends IAutoMovieSolidMeshConstraints.ISegment {
  /** Whether a later occurrence closed this edge in the opposite direction. */
  paired: boolean;
}

type Chart = ReadonlyMap<number, readonly [number, number]>;
type Identity = (a: number, b: number, turn: number) => string;
type Provenance = ReadonlyMap<string, IAutoMovieSolidMeshConstraints.IEdge>;
type Boundary = (
  constraints: readonly IAutoMovieSolidMeshConstraints.IEdge[],
  trimCount: number,
  domainCount: number,
  first: number,
  last: number,
) => IAutoMovieOpenSolidMeshResult | string;

/**
 * Read exposed source-domain cycles from the complete positive index plan.
 */
export function openAutoMovieSolidMesh(
  chart: Chart,
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  constraints: readonly IAutoMovieSolidMeshConstraints.IEdge[],
  trimCount: number,
  domainCount: number,
  first: number,
  last: number,
  period?: number,
): IAutoMovieOpenSolidMeshResult | string {
  const provenance: Provenance = provenanceOf(constraints);
  const collected = occurrences(triangles, nativeKey);
  if (typeof collected === "string") return collected;
  return readBoundary(
    chart,
    collected.uses,
    nativeKey,
    provenance,
    trimCount,
    domainCount,
    first,
    last,
    period,
  );
}

/** Boundary admissions for native and indexed positive face plans. */
export namespace openAutoMovieSolidMesh {
  /**
   * Check projection and collect the incidence of one indexed face plan.
   * Projection refusals precede the boundary reader's native refusals. The
   * returned reader uses the period already admitted for projection.
   */
  export function prepareIndexed(
    chart: Chart,
    triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
    period?: number,
  ): Boundary | string {
    const collected = occurrences(triangles, projectedKey, { chart, period });
    if (typeof collected === "string") return collected;
    return (constraints, trimCount, domainCount, first, last) => {
      const provenance: Provenance = provenanceOf(constraints);
      if (collected.failure !== undefined) return collected.failure;
      return readBoundary(
        chart,
        collected.uses,
        projectedKey,
        provenance,
        trimCount,
        domainCount,
        first,
        last,
        period,
      );
    };
  }
}

/** Collect the first directed occurrence and close opposite pairs. */
function occurrences(
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  identityOf: Identity,
  indexed?: { chart: Chart; period: number | undefined },
): { uses: ReadonlyMap<string, Edge>; failure?: string } | string {
  const uses: Map<string, Edge> = new Map();
  let failure: string | undefined;
  const period: number | undefined = indexed?.period;
  for (const triangle of triangles) {
    if (period !== undefined) {
      const phases: number[] = triangle.vertices.map(
        (id: number, k: number): number =>
          indexed!.chart.get(id)![1] + triangle.lifts[k]! * period,
      );
      if (
        !phases.every(Number.isFinite) ||
        Math.max(...phases) - Math.min(...phases) >= period / 2
      )
        return "indexed triangle has no unique sub-half-period cover";
    }
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const a: number = triangle.vertices[k]!;
      const b: number = triangle.vertices[next]!;
      const turn: number = triangle.lifts[next]! - triangle.lifts[k]!;
      if (!Number.isSafeInteger(turn)) {
        const detail = "triangle boundary cover is not representable";
        if (indexed === undefined) return detail;
        failure ??= detail;
      }
      const identity: string = identityOf(a, b, turn);
      const previous: Edge | undefined = uses.get(identity);
      if (
        indexed !== undefined &&
        previous !== undefined &&
        (a < b ? turn : -turn) !==
          (previous.a < previous.b ? previous.turn : -previous.turn)
      )
        return "distinct cover edges project onto one straight global mesh edge";
      if (previous === undefined)
        uses.set(identity, { a, b, turn, paired: false });
      else if (
        previous.paired ||
        previous.a !== b ||
        previous.b !== a ||
        previous.turn !== -turn
      ) {
        const detail =
          "triangle edge has nonmanifold or equally directed incidence";
        if (indexed === undefined) return detail;
        failure ??= detail;
      } else previous.paired = true;
    }
  }
  return { uses, failure };
}

/** Read the first-use order of exposed edges and recover their source cycles. */
function readBoundary(
  chart: Chart,
  uses: ReadonlyMap<string, Edge>,
  identityOf: Identity,
  provenance: Provenance,
  trimCount: number,
  domainCount: number,
  first: number,
  last: number,
  period: number | undefined,
): IAutoMovieOpenSolidMeshResult | string {
  const edges: Edge[] = [];
  const domainEdges: Set<string> = new Set();
  for (const edge of uses.values()) {
    if (edge.paired) continue;
    const source: IAutoMovieSolidMeshConstraints.IEdge | undefined =
      provenance.get(nativeKey(edge.a, edge.b, edge.turn));
    if (source === undefined)
      return "unpaired triangle edge has no source constraint";
    const trim: boolean = source.sources.some(
      (index: number): boolean => index < trimCount,
    );
    const domain: boolean = source.sources.some(
      (index: number): boolean =>
        index >= trimCount && index < trimCount + domainCount,
    );
    if (!trim && !domain)
      return "retained-grid boundary was not joined to its residual source";
    if (domain && !trim) domainEdges.add(identityOf(edge.a, edge.b, edge.turn));
    edges.push(edge);
  }
  const walks: IAutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(chart, edges, period);
  if (typeof walks === "string") return walks;
  const claimed: Set<string> = new Set();
  const cycles: IAutoMovieSolidMesh.IOpen[] = [];
  let partial: boolean = false;
  for (const walk of walks) {
    const boundary: IAutoMovieSolidMeshConstraints.ISegment[] = walk.vertices.map(
      (id: number, k: number): IAutoMovieSolidMeshConstraints.ISegment => ({
        a: id,
        b: walk.vertices[(k + 1) % walk.vertices.length]!,
        turn: (walk.lifts[k + 1] ?? walk.winding) - walk.lifts[k]!,
      }),
    );
    const keys: string[] = boundary.map(({ a, b, turn }) =>
      identityOf(a, b, turn),
    );
    const selected: boolean[] = boundary.map((edge, index): boolean => {
      const actual: Edge | undefined = uses.get(keys[index]!);
      return (
        actual !== undefined &&
        !actual.paired &&
        actual.a === edge.a &&
        actual.b === edge.b &&
        actual.turn === edge.turn
      );
    });
    if (!selected.some((value: boolean): boolean => value)) continue;
    if (!selected.every((value: boolean): boolean => value))
      return "exposed boundary has incompatible directed incidences";
    for (const key of keys) claimed.add(key);
    if (!keys.some((key): boolean => domainEdges.has(key))) continue;
    const points: [number, number][] = [];
    for (let k: number = 0; k < walk.vertices.length; k++) {
      const point: readonly [number, number] | undefined = chart.get(
        walk.vertices[k]!,
      );
      if (point === undefined)
        return "open boundary has no native face occurrence";
      const phase: number = point[1] + walk.lifts[k]! * (period ?? 0);
      if (!Number.isFinite(phase))
        return "open boundary phase cover is not representable";
      points.push([point[0], phase]);
    }
    const end: "bottom" | "top" | null =
      period === undefined
        ? null
        : points.every((point: [number, number]): boolean => point[0] === first)
          ? "bottom"
          : points.every(
                (point: [number, number]): boolean => point[0] === last,
              )
            ? "top"
            : null;
    if (
      period !== undefined &&
      (end === null || Math.abs(walk.winding) !== 1)
    ) {
      partial = true;
      continue;
    }
    cycles.push({
      vertices: [...walk.vertices],
      chart: points,
      winding: walk.winding,
      end,
    });
  }
  if (
    edges.some(({ a, b, turn }): boolean => !claimed.has(identityOf(a, b, turn)))
  )
    return "exposed domain boundary was not claimed by one positive native walk";
  return { cycles, partial };
}

/** Read the planner's original-source ordinals for each native-cover edge. */
function provenanceOf(
  constraints: readonly IAutoMovieSolidMeshConstraints.IEdge[],
): Provenance {
  return new Map(
    constraints.map((edge) => [nativeKey(edge.a, edge.b, edge.turn), edge]),
  );
}

/** Unoriented identity in the indexed quotient, where one cover is required. */
function projectedKey(a: number, b: number): string {
  return `${Math.min(a, b)}/${Math.max(a, b)}`;
}

/** Unoriented original-ID edge identity includes its relative cover turn. */
function nativeKey(a: number, b: number, turn: number): string {
  return a < b || (a === b && turn > 0)
    ? `${a}/${b}/${turn}`
    : `${b}/${a}/${-turn}`;
}
