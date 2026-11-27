import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
} from "@automovie/interface";

import { orientAutoMovieSolidChart } from "./construction/internal/orientAutoMovieSolidChart";

/**
 * Partition existing indexed chart constraints without inventing or welding a
 * point.
 *
 * T junctions and collinear overlaps are split at the caller's existing
 * vertices. Every subconstraint retains all of its original segment indices.
 * Proper crossings require a supplied shared vertex: that vertex belongs to the
 * analytic boundary producer, not a later triangle reconstruction. Periodic
 * edges carry an explicit cover turn, so coincident endpoints on different
 * sheets do not erase winding.
 */
export namespace AutoMovieSolidMeshConstraints {
  /** Whether an existing constraint contains this represented chart point. */
  export function contains(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    segments: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    point: Readonly<AutoMovieVector2Tuple>,
    period?: number,
  ): boolean | string {
    if (point.length !== 2 || (period !== undefined && !(period > 0)))
      return "constraint membership needs finite coordinates and a positive period";
    for (const segment of segments) {
      const a: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.a,
      );
      const stored: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.b,
      );
      if (
        a === undefined ||
        stored === undefined ||
        (period === undefined && segment.turn !== 0)
      )
        return "constraint membership has an unavailable endpoint or invalid turn";
      const b: Readonly<AutoMovieVector2Tuple> = [
        stored[0],
        stored[1] + segment.turn * (period ?? 0),
      ];
      const shifts: number[] | null = images(point[1], a[1], b[1], period);
      if (shifts === null)
        return "constraint membership image is not representable";
      for (const lift of shifts) {
        const lifted: Readonly<AutoMovieVector2Tuple> = [
          point[0],
          point[1] + lift * (period ?? 0),
        ];
        if (on(a, b, lifted)) return true;
      }
    }
    return false;
  }

  /**
   * Split already evaluated constraints; return their named premise failure
   * unchanged. Each primitive spans at most one period. Callers segment longer
   * source paths before this operation, as the existing sampled trim/grid
   * producers do.
   */
  export function split(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    segments: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    period?: number,
  ): IAutoMovieSolidMeshConstraints.IEdge[] | string {
    if (period !== undefined && !(period > 0))
      return "constraint period must be finite and positive";
    for (const entry of vertices) {
      const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
      if (id < 0 || point.length !== 2)
        return `constraint vertex ${id} needs an original nonnegative ID and finite chart coordinates`;
    }
    // The vertices by first coordinate: a vertex lies on a segment only inside
    // the segment's own range of it, which no lift changes, so each segment
    // reads that slice instead of every vertex.
    const sorted: [number, Readonly<AutoMovieVector2Tuple>][] = [
      ...vertices,
    ].sort(
      (
        x: [number, Readonly<AutoMovieVector2Tuple>],
        y: [number, Readonly<AutoMovieVector2Tuple>],
      ): number => x[1][0] - y[1][0],
    );
    const from: (value: number) => number = (value: number): number => {
      let low: number = 0;
      let high: number = sorted.length;
      while (low < high) {
        const middle: number = (low + high) >> 1;
        if (sorted[middle]![1][0] < value) low = middle + 1;
        else high = middle;
      }
      return low;
    };
    const pieces: Map<string, IAutoMovieSolidMeshConstraints.IEdge> = new Map();
    for (let source: number = 0; source < segments.length; source++) {
      const segment: IAutoMovieSolidMeshConstraints.ISegment =
        segments[source]!;
      const a: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.a,
      );
      const stored: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.b,
      );
      if (
        a === undefined ||
        stored === undefined ||
        (period === undefined && segment.turn !== 0)
      )
        return `constraint ${source} has an unavailable endpoint or invalid turn`;
      const b: Readonly<AutoMovieVector2Tuple> = [
        stored[0],
        stored[1] + segment.turn * (period ?? 0),
      ];
      if (a[0] === b[0] && a[1] === b[1])
        return `constraint ${source} has no finite nonzero lifted span`;
      if (period !== undefined) {
        const magnitude: number = Math.max(
          Math.abs(a[1]),
          Math.abs(b[1]),
          period,
        );
        // This reserve admits roundoff in the image-count bound only; it
        // never changes a coordinate or classifies a contact.
        if (
          Math.abs(b[1] / magnitude - a[1] / magnitude) >
          (period / magnitude) * (1 + 16 * Number.EPSILON)
        )
          return `constraint ${source} must be supplied as single-period primitives`;
      }
      const cuts: Cut[] = [
        { id: segment.a, turn: 0, point: a },
        { id: segment.b, turn: segment.turn, point: b },
      ];
      const highest: number = Math.max(a[0], b[0]);
      for (
        let k: number = from(Math.min(a[0], b[0]));
        k < sorted.length && sorted[k]![1][0] <= highest;
        k++
      ) {
        const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] =
          sorted[k]!;
        const shifts: number[] | null = images(point[1], a[1], b[1], period);
        if (shifts === null)
          return `constraint ${source} has an unrepresentable cover image`;
        for (const turn of shifts) {
          const lifted: Readonly<AutoMovieVector2Tuple> = [
            point[0],
            point[1] + turn * (period ?? 0),
          ];
          if (on(a, b, lifted)) cuts.push({ id, turn, point: lifted });
        }
      }
      const axis: 0 | 1 =
        Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? 0 : 1;
      const direction: number = b[axis] > a[axis] ? 1 : -1;
      cuts.sort(
        (x: Cut, y: Cut): number =>
          direction *
          (x.point[axis] < y.point[axis]
            ? -1
            : x.point[axis] > y.point[axis]
              ? 1
              : 0),
      );
      const ordered: Cut[] = [];
      for (const cut of cuts) {
        const previous: Cut | undefined = ordered[ordered.length - 1];
        if (
          previous !== undefined &&
          previous.point[0] === cut.point[0] &&
          previous.point[1] === cut.point[1]
        ) {
          if (previous.id !== cut.id || previous.turn !== cut.turn)
            return `constraint ${source} has coincident authoritative vertices ${previous.id} and ${cut.id}`;
        } else ordered.push(cut);
      }
      for (let k: number = 1; k < ordered.length; k++) {
        const from: Cut = ordered[k - 1]!;
        const to: Cut = ordered[k]!;
        const forward: boolean =
          from.id < to.id || (from.id === to.id && to.turn > from.turn);
        const edge: IAutoMovieSolidMeshConstraints.ISegment = forward
          ? { a: from.id, b: to.id, turn: to.turn - from.turn }
          : { a: to.id, b: from.id, turn: from.turn - to.turn };
        const key: string = `${edge.a}/${edge.b}/${edge.turn}`;
        const known: IAutoMovieSolidMeshConstraints.IEdge | undefined =
          pieces.get(key);
        if (known === undefined)
          pieces.set(key, { ...edge, sources: [source] });
        else if (known.sources[known.sources.length - 1] !== source)
          known.sources.push(source);
      }
    }
    const edges: IAutoMovieSolidMeshConstraints.IEdge[] = [...pieces.values()];

    // Two pieces whose ranges of the first coordinate are apart cannot cross.
    const range: [number, number][] = edges.map(
      (edge: IAutoMovieSolidMeshConstraints.IEdge): [number, number] => {
        const p: number = vertices.get(edge.a)![0];
        const q: number = vertices.get(edge.b)![0];
        return [Math.min(p, q), Math.max(p, q)];
      },
    );
    for (let i: number = 0; i < edges.length; i++)
      for (let j: number = i + 1; j < edges.length; j++) {
        if (range[i]![1] < range[j]![0] || range[j]![1] < range[i]![0])
          continue;
        const edge: IAutoMovieSolidMeshConstraints.IEdge = edges[i]!;
        const other: IAutoMovieSolidMeshConstraints.IEdge = edges[j]!;
        const a: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.a)!;
        const endpoint: Readonly<AutoMovieVector2Tuple> = vertices.get(edge.b)!;
        const b: Readonly<AutoMovieVector2Tuple> = [
          endpoint[0],
          endpoint[1] + edge.turn * (period ?? 0),
        ];
        const origin: Readonly<AutoMovieVector2Tuple> = vertices.get(other.a)!;
        const shifts: number[] | null = images(origin[1], a[1], b[1], period);
        if (shifts === null)
          return "subconstraint cover image is not representable";
        for (const turn of shifts) {
          const target: Readonly<AutoMovieVector2Tuple> = vertices.get(
            other.b,
          )!;
          const c: Readonly<AutoMovieVector2Tuple> = [
            origin[0],
            origin[1] + turn * (period ?? 0),
          ];
          const d: Readonly<AutoMovieVector2Tuple> = [
            target[0],
            target[1] + (turn + other.turn) * (period ?? 0),
          ];
          const crosses: boolean =
            orientAutoMovieSolidChart(a, b, c) *
              orientAutoMovieSolidChart(a, b, d) <
              0 &&
            orientAutoMovieSolidChart(c, d, a) *
              orientAutoMovieSolidChart(c, d, b) <
              0;
          if (crosses)
            return `subconstraints ${i} and ${j} cross without a supplied shared vertex`;
        }
      }
    return edges;
  }
}

/*
 * One indexed point in the universal cover of a periodic chart.
 */
interface Cut {
  /*
   * Original shared vertex identity.
   */
  id: number;

  /*
   * Integer period added to that vertex's stored phase.
   */
  turn: number;

  /*
   * Representable lifted coordinates for predicates and ordering only.
   */
  point: Readonly<AutoMovieVector2Tuple>;
}

/*
 * Exact represented-point membership on a closed straight segment; no identity
 * is inferred from it.
 */
function on(
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
  point: Readonly<AutoMovieVector2Tuple>,
): boolean {
  return (
    point[0] >= Math.min(a[0], b[0]) &&
    point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) &&
    point[1] <= Math.max(a[1], b[1]) &&
    orientAutoMovieSolidChart(a, b, point) === 0
  );
}

/*
 * Three neighbouring images cover a primitive of at most one period; the
 * midpoint calculation avoids overflow.
 */
function images(
  value: number,
  first: number,
  last: number,
  period: number | undefined,
): number[] | null {
  if (period === undefined) return [0];
  const middle: number = first === last ? first : first / 2 + last / 2;
  const turn: number = Math.round((middle - value) / period);
  return [turn - 1, turn, turn + 1];
}
