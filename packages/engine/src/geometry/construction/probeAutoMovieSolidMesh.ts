import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";
import { witnessAutoMovieSolidChartTriangle } from "./witnessAutoMovieSolidChartTriangle";

/** Represented finite native-chart point. */
type Point = readonly [number, number];

/**
 * Select a represented left-side probe with an independently checked corridor.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Floating edge clearance proposes a nearby point; exact represented-point orientation and the empty-triangle witness verify connection to the requested boundary side before membership is read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Probe construction is one responsibility shared by component classification; the witness owns exact partition checks and Plan owns membership.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not call approximate distance an exact bound. At most 64 smaller proposals are attempted; unrepresentable clearance or exhausted local search returns an explicit failure, not an empty region.
 * @evidence contracts/development/common.md#meaningful-documentation States represented-number corridor meaning, one-period primitive premise and finite search/precision failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans S segments for a proposal and at most 64 witnesses with O(V+S) exact-predicate work each; no source callback is evaluated here.
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
  const target: number =
    walk.vertices.length > 1 ? walk.vertices[1]! : walk.vertices[0]!;
  const first: Point = vertices.get(walk.vertices[0]!)!;
  const stored: Point = vertices.get(target)!;
  const turn: number = walk.lifts[1] ?? walk.winding;
  const end: Point = [stored[0], stored[1] + turn * (period ?? 0)];
  const middle: Point = midpoint(first, end);
  const dx: number = end[0] - first[0];
  const dy: number = end[1] - first[1];
  const length: number = Math.hypot(dx, dy);
  let clearance: number = length / 2;
  const own: string = key({
    a: walk.vertices[0]!,
    b: target,
    turn,
  });
  for (const edge of edges) {
    const a: Point = vertices.get(edge.a)!;
    const b: Point = vertices.get(edge.b)!;
    const shifts: number[] | null = images(a[1], first, end, period);
    if (shifts === null)
      return "visibility probe cover image is not representable";
    for (const image of shifts) {
      const c: Point = [a[0], a[1] + image * (period ?? 0)];
      const d: Point = [b[0], b[1] + (image + edge.turn) * (period ?? 0)];
      if (![...c, ...d].every(Number.isFinite))
        return "visibility probe cover coordinates are not representable";
      if (
        key(edge) === own &&
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
  if (
    !(
      Number.isFinite(clearance) &&
      clearance > 0 &&
      Number.isFinite(length) &&
      length > 0
    )
  )
    return "visibility boundary clearance is not representable";
  const edge: AutoMovieSolidMeshConstraints.ISegment = {
    a: walk.vertices[0]!,
    b: target,
    turn,
  };
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
  return "visibility left-side probe has no admitted represented corridor";
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
