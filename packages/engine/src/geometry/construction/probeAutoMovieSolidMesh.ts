import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import type { AutoMovieSolidMeshIncidence } from "./AutoMovieSolidMeshIncidence";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";
import { witnessAutoMovieSolidChartTriangle } from "./witnessAutoMovieSolidChartTriangle";

/** Represented finite native-chart point. */
type Point = readonly [number, number];

/**
 * Select a represented left-side probe with an independently checked corridor.
 *
 * A boundary walk is one face cycle: the face lies on the left of every one of its edges, so a probe witnessed beside any edge reads that
 * face's membership. The edges are tried in walk order and the first witnessed corridor is returned. Reading the first edge alone failed
 * where a curve met a straight constraint at a grazing angle: the curve's last vertex stood 1e-14 off the line, a few units of the last
 * place at the chart's scale, so its short edge to the line had no represented corridor on either side, though the face beside every other
 * edge of the same walk was wide.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Floating edge clearance proposes a nearby point; exact represented-point orientation and the empty-triangle witness verify connection to the requested boundary side before membership is read. Any edge of a face cycle bounds the same face, so trying the next edge does not change which face is read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Probe construction is one responsibility shared by component classification; the witness owns exact partition checks and Plan owns membership.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not call approximate distance an exact bound. At most 64 smaller proposals are attempted per edge; unrepresentable cover arithmetic returns an explicit failure, and a walk none of whose edges admits a corridor returns the named failure, not an empty region.
 * @evidence contracts/development/common.md#meaningful-documentation States represented-number corridor meaning, face-cycle premise, one-period primitive premise and finite search/precision failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Scans S segments for a proposal and at most 64 witnesses with O(V+S) exact-predicate work each, per edge tried; the first edge serves every walk that is not degenerate there.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares original indexed endpoints, one edge length and the proposed clearance across attempts on one edge; source membership remains with Plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Probe, local image arrays and witness scratch expire on return; no source map, callback or cache is retained.
 */
export function probeAutoMovieSolidMesh(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  walk: AutoMovieSolidMeshIncidence.IWalk,
  period: number | undefined,
): Point | string {
  const count: number = walk.vertices.length;
  if (count === 0) return "visibility has an empty boundary walk";
  for (let k: number = 0; k < count; k++) {
    // Edge k from the walk's k-th vertex to the next, read in the cover image where the k-th vertex is unlifted.
    const next: number = (k + 1) % count;
    const turn: number =
      (next === 0 ? walk.winding : walk.lifts[next]!) - walk.lifts[k]!;
    const found: Point | string | null = corridor(
      vertices,
      edges,
      { a: walk.vertices[k]!, b: walk.vertices[next]!, turn },
      period,
    );
    if (typeof found === "string") return found;
    if (found !== null)
      return k === 0 || walk.lifts[k] === 0
        ? found
        : [found[0], found[1] + walk.lifts[k]! * (period ?? 0)];
  }
  return "visibility left-side probe has no admitted represented corridor";
}

/** A witnessed probe on the left of one boundary edge, null when that edge admits no represented corridor, or a named arithmetic failure. */
function corridor(
  vertices: ReadonlyMap<number, Point>,
  edges: readonly AutoMovieSolidMeshConstraints.ISegment[],
  edge: AutoMovieSolidMeshConstraints.ISegment,
  period: number | undefined,
): Point | string | null {
  const first: Point = vertices.get(edge.a)!;
  const stored: Point = vertices.get(edge.b)!;
  const end: Point = [stored[0], stored[1] + edge.turn * (period ?? 0)];
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
  // Another constraint through this edge's midpoint, or an edge too short to measure, leaves this edge no corridor.
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
