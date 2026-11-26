import type {
  IAutoMovieOpenSolidMeshResult,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

import { AutoMovieSolidMeshIncidence } from "../AutoMovieSolidMeshIncidence";

/** Read exposed source-domain cycles from the complete positive index plan. */
export function openAutoMovieSolidMesh(
  chart: ReadonlyMap<number, readonly [number, number]>,
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  constraints: readonly IAutoMovieSolidMeshConstraints.IEdge[],
  trimCount: number,
  domainCount: number,
  first: number,
  last: number,
  period?: number,
): IAutoMovieOpenSolidMeshResult | string {
  const provenance: Map<string, IAutoMovieSolidMeshConstraints.IEdge> = new Map(
    constraints.map(
      (
        edge: IAutoMovieSolidMeshConstraints.IEdge,
      ): [string, IAutoMovieSolidMeshConstraints.IEdge] => [key(edge), edge],
    ),
  );
  const uses: Map<string, Edge> = new Map();
  const counts: Map<string, number> = new Map();
  for (const triangle of triangles)
    for (let k: number = 0; k < 3; k++) {
      const next: number = (k + 1) % 3;
      const edge: Edge = {
        a: triangle.vertices[k]!,
        b: triangle.vertices[next]!,
        turn: triangle.lifts[next]! - triangle.lifts[k]!,
        domain: false,
      };
      const identity: string = key(edge);
      const count: number = (counts.get(identity) ?? 0) + 1;
      counts.set(identity, count);
      const previous: Edge | undefined = uses.get(identity);
      if (
        count > 2 ||
        (previous !== undefined &&
          !(
            previous.a === edge.b &&
            previous.b === edge.a &&
            previous.turn === -edge.turn
          ))
      )
        return "triangle edge has nonmanifold or equally directed incidence";
      if (previous === undefined) uses.set(identity, edge);
      else uses.delete(identity);
    }
  for (const entry of uses) {
    const [identity, edge]: [string, Edge] = entry;
    const source: IAutoMovieSolidMeshConstraints.IEdge | undefined =
      provenance.get(identity);
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
    edge.domain = domain && !trim;
  }
  const edges: Edge[] = [...uses.values()];
  const walks: IAutoMovieSolidMeshIncidence.IWalk[] | string =
    AutoMovieSolidMeshIncidence.walks(chart, edges, period);
  if (typeof walks === "string") return walks;
  const claimed: Set<string> = new Set();
  const cycles: IAutoMovieSolidMesh.IOpen[] = [];
  let partial: boolean = false;
  for (const walk of walks) {
    const boundary: Edge[] = walk.vertices.map(
      (id: number, k: number): Edge => ({
        a: id,
        b: walk.vertices[(k + 1) % walk.vertices.length]!,
        turn: (walk.lifts[k + 1] ?? walk.winding) - walk.lifts[k]!,
        domain: false,
      }),
    );
    const selected: boolean[] = boundary.map((edge: Edge): boolean => {
      const actual: Edge | undefined = uses.get(key(edge));
      return (
        actual !== undefined &&
        actual.a === edge.a &&
        actual.b === edge.b &&
        actual.turn === edge.turn
      );
    });
    if (!selected.some((value: boolean): boolean => value)) continue;
    if (!selected.every((value: boolean): boolean => value))
      return "exposed boundary has incompatible directed incidences";
    for (const edge of boundary) claimed.add(key(edge));
    if (!boundary.some((edge: Edge): boolean => uses.get(key(edge))!.domain))
      continue;
    const points: [number, number][] = [];
    for (let k: number = 0; k < walk.vertices.length; k++) {
      const point: readonly [number, number] | undefined = chart.get(
        walk.vertices[k]!,
      );
      if (point === undefined)
        return "open boundary has no native face occurrence";
      const phase: number = point[1] + walk.lifts[k]! * (period ?? 0);
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
  if (edges.some((edge: Edge): boolean => !claimed.has(key(edge))))
    return "exposed domain boundary was not claimed by one positive native walk";
  return { cycles, partial };
}

/** A directed boundary occurrence in an explicit native cover. */
interface Edge extends IAutoMovieSolidMeshConstraints.ISegment {
  /** Whether this exposed edge belongs only to the sampling domain. */ domain: boolean;
}

/** Unoriented original-ID edge identity includes its relative cover turn. */
function key(edge: IAutoMovieSolidMeshConstraints.ISegment): string {
  return edge.a < edge.b || (edge.a === edge.b && edge.turn > 0)
    ? `${edge.a}/${edge.b}/${edge.turn}`
    : `${edge.b}/${edge.a}/${-edge.turn}`;
}
