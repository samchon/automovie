import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
} from "@automovie/interface";

import { orientAutoMovieSolidChart } from "./internal/orientAutoMovieSolidChart";

/** A directed incidence, including its endpoint's explicit cover image. */
interface Halfedge {
  /** Original source vertex ID. */
  from: number;

  /** Original target vertex ID. */
  to: number;

  /** Relative period turn from source to target. */
  turn: number;

  /** Oppositely directed incidence of the same subconstraint. */
  twin: number;

  /** Lifted target used for angular order at its source. */
  end: Readonly<AutoMovieVector2Tuple>;
}

/**
 * Native-chart halfedge incidence after shared constraint subdivision.
 *
 * Every vertex retains all outgoing incidences. Counterclockwise angular order
 * and the clockwise successor of each twin walk the boundary on the left. Walks
 * are boundary components, not necessarily separate faces: disconnected holes
 * can belong to one face. A periodic walk can close in the surface while
 * retaining a nonzero cover winding. Selection and triangulation belong later.
 */
export namespace AutoMovieSolidMeshIncidence {
  /**
   * Read every directed boundary component of an already split constraint
   * graph.
   */
  export function walks(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    segments: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    period?: number,
  ): IAutoMovieSolidMeshIncidence.IWalk[] | string {
    if (period !== undefined && !(period > 0))
      return "incidence period must be finite and positive";
    for (const entry of vertices) {
      const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
      if (id < 0 || point.length !== 2)
        return "incidence needs original nonnegative IDs and finite chart coordinates";
    }
    const halves: Halfedge[] = [];
    const around: Map<number, number[]> = new Map();
    for (const segment of segments) {
      const a: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.a,
      );
      const b: Readonly<AutoMovieVector2Tuple> | undefined = vertices.get(
        segment.b,
      );
      if (
        a === undefined ||
        b === undefined ||
        (period === undefined && segment.turn !== 0)
      )
        return "incidence needs finite original endpoints and valid turns";
      const forward: Readonly<AutoMovieVector2Tuple> = [
        b[0],
        b[1] + segment.turn * (period ?? 0),
      ];
      const reverse: Readonly<AutoMovieVector2Tuple> = [
        a[0],
        a[1] - segment.turn * (period ?? 0),
      ];
      if (
        (a[0] === forward[0] && a[1] === forward[1]) ||
        (b[0] === reverse[0] && b[1] === reverse[1])
      )
        return "incidence has an unrepresentable lifted direction";
      const index: number = halves.length;
      halves.push(
        {
          from: segment.a,
          to: segment.b,
          turn: segment.turn,
          twin: index + 1,
          end: forward,
        },
        {
          from: segment.b,
          to: segment.a,
          turn: -segment.turn,
          twin: index,
          end: reverse,
        },
      );
      const first: number[] = around.get(segment.a) ?? [];
      first.push(index);
      around.set(segment.a, first);
      const second: number[] = around.get(segment.b) ?? [];
      second.push(index + 1);
      around.set(segment.b, second);
    }
    const positions: Map<number, number> = new Map();
    for (const entry of around) {
      const [vertex, outgoing]: [number, number[]] = entry;
      const origin: Readonly<AutoMovieVector2Tuple> = vertices.get(vertex)!;
      outgoing.sort(
        (a: number, b: number): number =>
          order(origin, halves[a]!.end, halves[b]!.end) || a - b,
      );
      for (let k: number = 0; k < outgoing.length; k++) {
        if (
          k > 0 &&
          order(
            origin,
            halves[outgoing[k - 1]!]!.end,
            halves[outgoing[k]!]!.end,
          ) === 0
        )
          return `vertex ${vertex} has overlapping outgoing directions; constraints must be split first`;
        positions.set(outgoing[k]!, k);
      }
    }
    const next: number[] = halves.map((edge: Halfedge): number => {
      const outgoing: number[] = around.get(edge.to)!;
      return outgoing[
        (positions.get(edge.twin)! + outgoing.length - 1) % outgoing.length
      ]!;
    });
    const seen: Uint8Array = new Uint8Array(halves.length);
    const result: IAutoMovieSolidMeshIncidence.IWalk[] = [];
    for (let first: number = 0; first < halves.length; first++) {
      if (seen[first] === 1) continue;
      const ids: number[] = [];
      const lifts: number[] = [];
      let winding: number = 0;
      let edge: number = first;
      while (seen[edge] === 0) {
        const at: Halfedge = halves[edge]!;
        seen[edge] = 1;
        ids.push(at.from);
        lifts.push(winding);
        winding += at.turn;
        edge = next[edge]!;
      }
      if (edge !== first)
        return "boundary incidences do not form disjoint successor cycles";
      result.push({ vertices: ids, lifts, winding });
    }
    return result;
  }
}

/**
 * Counterclockwise direction order without atan2 ties or coordinate
 * normalization.
 */
function order(
  origin: Readonly<AutoMovieVector2Tuple>,
  a: Readonly<AutoMovieVector2Tuple>,
  b: Readonly<AutoMovieVector2Tuple>,
): number {
  const halfA: number =
    a[1] > origin[1] || (a[1] === origin[1] && a[0] >= origin[0]) ? 0 : 1;
  const halfB: number =
    b[1] > origin[1] || (b[1] === origin[1] && b[0] >= origin[0]) ? 0 : 1;
  if (halfA !== halfB) return halfA - halfB;
  return -orientAutoMovieSolidChart(origin, a, b);
}
