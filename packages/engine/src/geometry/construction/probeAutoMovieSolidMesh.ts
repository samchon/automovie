import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
} from "@automovie/interface";

import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";
import { witnessAutoMovieSolidChartTriangle } from "./witnessAutoMovieSolidChartTriangle";

/**
 * Select a represented left-side probe with an independently checked corridor.
 *
 * A boundary walk is one face cycle: the face lies on the left of every one of
 * its edges, so a probe witnessed beside any edge reads that face's membership.
 * The edges are tried in walk order and the first witnessed corridor is
 * returned. Reading the first edge alone failed where a curve met a straight
 * constraint at a grazing angle: the curve's last vertex stood 1e-14 off the
 * line, a few units of the last place at the chart's scale, so its short edge
 * to the line had no represented corridor on either side, though the face
 * beside every other edge of the same walk was wide.
 */
export function probeAutoMovieSolidMesh(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  walk: IAutoMovieSolidMeshIncidence.IWalk,
  period: number | undefined,
): Readonly<AutoMovieVector2Tuple> | string {
  const count: number = walk.vertices.length;
  if (count === 0) return "visibility has an empty boundary walk";
  for (let k: number = 0; k < count; k++) {
    // Edge k from the walk's k-th vertex to the next, read in the cover image where the k-th vertex is unlifted.
    const next: number = (k + 1) % count;
    const turn: number =
      (next === 0 ? walk.winding : walk.lifts[next]!) - walk.lifts[k]!;
    const found: Readonly<AutoMovieVector2Tuple> | string | null = corridor(
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

/**
 * A witnessed probe on the left of one boundary edge, null when that edge
 * admits no represented corridor, or a named arithmetic failure.
 */
function corridor(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  edge: IAutoMovieSolidMeshConstraints.ISegment,
  period: number | undefined,
): Readonly<AutoMovieVector2Tuple> | string | null {
  const first: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.a)!;
  const stored: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.b)!;
  const end: Readonly<AutoMovieVector2Tuple> = [
    stored[0],
    stored[1] + edge.turn * (period ?? 0),
  ];
  const middle: Readonly<AutoMovieVector2Tuple> = midpoint(first, end);
  const dx: number = end[0] - first[0];
  const dy: number = end[1] - first[1];
  const length: number = Math.hypot(dx, dy);
  let clearance: number = length / 2;
  const own: string = key(edge);
  for (const other of edges) {
    const a: Readonly<AutoMovieVector2Tuple> = vertices.get(other.a)!;
    const b: Readonly<AutoMovieVector2Tuple> = vertices.get(other.b)!;
    const shifts: number[] | null = images(a[1], first, end, period);
    if (shifts === null)
      return "visibility probe cover image is not representable";
    for (const image of shifts) {
      const c: Readonly<AutoMovieVector2Tuple> = [
        a[0],
        a[1] + image * (period ?? 0),
      ];
      const d: Readonly<AutoMovieVector2Tuple> = [
        b[0],
        b[1] + (image + other.turn) * (period ?? 0),
      ];
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
  if (!(clearance > 0 && length > 0)) return null;
  for (let attempt: number = 0; attempt < 64; attempt++) {
    const step: number = clearance / 4;
    const probe: Readonly<AutoMovieVector2Tuple> = [
      middle[0] - (dy / length) * step,
      middle[1] + (dx / length) * step,
    ];
    if (orientAutoMovieSolidChart(first, end, probe) > 0) {
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

/**
 * Floating distance proposes a probe only; witness checks decide the
 * represented corridor.
 */
function distance(
  point: Readonly<AutoMovieVector2Tuple>,
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
): number {
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
function midpoint(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
): Readonly<AutoMovieVector2Tuple> {
  return [
    a[0] === b[0] ? a[0] : a[0] / 2 + b[0] / 2,
    a[1] === b[1] ? a[1] : a[1] / 2 + b[1] / 2,
  ];
}

/** Local cover images for one-period source primitives. */
function images(
  value: number,
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: Readonly<AutoMovieVector2Tuple> = midpoint(a, b);
  const nearest: number = Math.round((middle[1] - value) / period);
  return [nearest - 1, nearest, nearest + 1];
}

/** Unoriented segment identity includes the relative cover turn. */
function key(edge: IAutoMovieSolidMeshConstraints.ISegment): string {
  return edge.a < edge.b || (edge.a === edge.b && edge.turn > 0)
    ? `${edge.a}/${edge.b}/${edge.turn}`
    : `${edge.b}/${edge.a}/${-edge.turn}`;
}
