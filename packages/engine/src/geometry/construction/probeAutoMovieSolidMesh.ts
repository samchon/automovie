import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";
import { witnessAutoMovieSolidChartTriangle } from "./witnessAutoMovieSolidChartTriangle";

/** Represented finite native-chart point. */
type Point = readonly [number, number];

/**
 * Select a represented left-side probe with an independently checked corridor, beside the walk's first edge that admits one.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Floating edge clearance proposes a nearby point; exact represented-point orientation and the empty-triangle witness verify connection to the requested boundary side before membership is read. Every edge of a boundary walk has the walk's face on its left, so any edge's corridor reaches the same face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Probe construction is one responsibility shared by component classification; the witness owns exact partition checks and Plan owns membership.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not call approximate distance an exact bound. At most 64 smaller proposals are attempted beside each walk edge; when no edge's clearance is representable or every local search is exhausted it returns an explicit failure, not an empty region.
 * @evidence contracts/development/common.md#meaningful-documentation States represented-number corridor meaning, one-period primitive premise and finite search/precision failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans S segments for a proposal and at most 64 witnesses with O(V+S) exact-predicate work each, for each walk edge tried in order; the first admitted edge ends the search, which is the first edge unless it lies within a unit in the last place of another constraint. No source callback is evaluated here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares original indexed endpoints, one edge length and the proposed clearance across attempts; source membership remains with Plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Probe, local image arrays and witness scratch expire on return; no source map, callback or cache is retained.
 */
export function probeAutoMovieSolidMesh(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  walk: AutoMovieSolidMeshIncidence.IWalk,
  period: number | undefined,
): Point | string {
  if (walk.vertices.length === 0)
    return "visibility has an empty boundary walk";

  // Every edge of a boundary walk has the walk's face on its left, so the probe may stand beside any of them. Beside the first alone, a
  // walk whose first edge runs within a unit in the last place of another constraint, as where a rail's vertex stood 7e-15 off its
  // face's station line beside f1's ear band, has no represented point between the two and was refused.
  const count: number = walk.vertices.length;
  for (let k: number = 0; k < count; k++) {
    const next: number = (k + 1) % count;
    const turn: number =
      (next === 0 ? walk.winding : walk.lifts[next]!) - walk.lifts[k]!;
    const probe: Point | string | null = beside(
      vertices,
      edges,
      { a: walk.vertices[k]!, b: walk.vertices[next]!, turn },
      period,
    );
    if (probe !== null) return probe;
  }
  return "visibility left-side probe has no admitted represented corridor";
}

/**
 * A represented probe on the left of one directed walk edge, the edge's start read at its stored cover; `null` when no admitted corridor
 * is found beside it.
 */
function beside(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  edge: AutoMovieSolidMeshConstraints.ISegment,
  period: number | undefined,
): Point | string | null {
  const target: number = edge.b;
  const first: Point = vertices.get(edge.a)!;
  const stored: Point = vertices.get(target)!;
  const turn: number = edge.turn;
  const end: Point = [stored[0], stored[1] + turn * (period ?? 0)];
  const middle: Point = midpoint(first, end);
  const dx: number = end[0] - first[0];
  const dy: number = end[1] - first[1];
  const length: number = Math.hypot(dx, dy);
  let clearance: number = length / 2;
  const own: string = key(edge);
  for (const other of edges) {
    const a: Point = vertices.get(other.a)!;
    const b: Point = vertices.get(other.b)!;
    const shifts: number[] | null = images(a[1], first, end, period);
    if (shifts === null)
      return "visibility probe cover image is not representable";
    for (const image of shifts) {
      const c: Point = [a[0], a[1] + image * (period ?? 0)];
      const d: Point = [b[0], b[1] + (image + other.turn) * (period ?? 0)];
      if (![...c, ...d].every(Number.isFinite))
        return "visibility probe cover coordinates are not representable";
      if (
        key(other) === own &&
        ((c[0] === first[0] &&
          c[1] === first[1] &&
          d[0] === end[0] &&
          d[1] === end[1]) ||
          (d[0] === first[0] &&
            d[1] === first[1] &&
            c[0] === end[0] &&
            c[1] === end[1]))
      )
        continue;
      clearance = Math.min(clearance, distance(middle, c, d));
    }
  }
  // No clearance beside this edge: another constraint passes through its midpoint, or the edge has no length; the next edge may serve.
  if (
    !(
      Number.isFinite(clearance) &&
      clearance > 0 &&
      Number.isFinite(length) &&
      length > 0
    )
  )
    return null;
  for (let attempt: number = 0; attempt < 64; attempt++) {
    const step: number = clearance / 4;
    const probe: Point = [
      middle[0] - (dy / length) * step,
      middle[1] + (dx / length) * step,
    ];
    if (
      probe.every(Number.isFinite) &&
      orientAutoMovieSolidChart(first, end, probe) > 0
    ) {
      const witness: boolean | string = witnessAutoMovieSolidChartTriangle(
        vertices,
        edges,
        edge,
        probe,
        period,
      );
      if (typeof witness === "string") return witness;
      if (witness) return probe;
    }
    clearance /= 2;
  }
  return null;
}

/** Floating distance proposes a probe only; witness checks decide the represented corridor. */
function distance(point: Point, a: Point, b: Point): number {
  const dx: number = b[0] - a[0];
  const dy: number = b[1] - a[1];
  const length: number = Math.hypot(dx, dy);
  const x: number = point[0] - a[0];
  const y: number = point[1] - a[1];
  const at: number = Math.max(
    0,
    Math.min(length, x * (dx / length) + y * (dy / length)),
  );
  return Math.hypot(x - at * (dx / length), y - at * (dy / length));
}

/** Same finite midpoint formula used by the visibility owner. */
function midpoint(a: Point, b: Point): Point {
  return [
    a[0] === b[0] ? a[0] : a[0] / 2 + b[0] / 2,
    a[1] === b[1] ? a[1] : a[1] / 2 + b[1] / 2,
  ];
}

/** Local cover images for one-period source primitives. */
function images(
  value: number,
  a: Point,
  b: Point,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: Point = midpoint(a, b);
  const nearest: number = Math.round((middle[1] - value) / period);
  return Number.isSafeInteger(nearest) &&
    Number.isSafeInteger(nearest - 1) &&
    Number.isSafeInteger(nearest + 1)
    ? [nearest - 1, nearest, nearest + 1]
    : null;
}

/** Unoriented segment identity includes the relative cover turn. */
function key(edge: AutoMovieSolidMeshConstraints.ISegment): string {
  return edge.a < edge.b || (edge.a === edge.b && edge.turn > 0)
    ? `${edge.a}/${edge.b}/${edge.turn}`
    : `${edge.b}/${edge.a}/${-edge.turn}`;
}
