import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/** One finite native-chart point. */
type Point = readonly [number, number];

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
  end: Point;
}

/**
 * Native-chart halfedge incidence after shared constraint subdivision.
 *
 * Every vertex retains all outgoing incidences. Counterclockwise angular order
 * and the clockwise successor of each twin walk the boundary on the left.
 * Walks are boundary components, not necessarily separate faces: disconnected
 * holes can belong to one face. A periodic walk can close in the surface while
 * retaining a nonzero cover winding. Selection and triangulation belong later.
 *
 * @evidence contracts/common.md#principled-implementation Uses paired directed edges and cyclic exact-sign angular order to preserve arbitrary vertex degree and each left boundary component; integer cover lifts preserve periodic winding.
 * @evidence contracts/common.md#clear-and-simple-design One incidence reader consumes already split constraints and returns only indexed walks, leaving source geometry, face membership and triangulation separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never reduces a vertex to one outgoing edge or equates a closed surface walk with a zero-winding planar polygon. Overlapping directions remain a named failed subdivision premise.
 * @evidence contracts/common.md#meaningful-documentation States left-side convention, boundary-component meaning, periodic lifts and later ownership of holes/face membership.
 * @evidence contracts/performance.md#efficient-algorithms Creates 2E halfedges and sorts each degree-d vertex in O(d log d), then walks each directed edge once; exact-predicate cost is owned by the chart orientation primitive.
 * @evidence contracts/performance.md#reuse-equivalent-work One sorted incidence population and one twin-position table serve every boundary traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(V+E) halfedges, adjacency and visited state are local; callers own returned index/lift arrays and no mesh or callback is retained.
 */
export namespace AutoMovieSolidMeshIncidence {
  /**
   * One directed left boundary component in the native parameter cover.
   *
   * @evidence contracts/common.md#principled-implementation Original vertex IDs and integer lifts describe the walk without converting identified surface points to an annular polygon.
   * @evidence contracts/common.md#clear-and-simple-design Parallel ID/lift arrays plus total winding expose its complete combinatorial path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not claim a nonzero-winding walk bounds a planar region or that one component owns an entire face.
   * @evidence contracts/common.md#meaningful-documentation States cover origin, omitted repeated closing point and winding meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result record has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Boundary traversal owns population reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns both fresh arrays and a scalar; no input object is retained.
   */
  export interface IWalk {
    /** Original vertex IDs, without repeating the closing vertex. */
    vertices: number[];

    /** Period integers added at each vertex; the first is zero. */
    lifts: number[];

    /** Total period change on returning to the first vertex ID. */
    winding: number;
  }

  /**
   * Read every directed boundary component of an already split constraint graph.
   *
   * @evidence contracts/common.md#principled-implementation Sorts outgoing halfedges around each source, follows the predecessor of the twin at each target and accumulates the represented cover turn.
   * @evidence contracts/common.md#clear-and-simple-design One result union returns all walks or the named finite/subdivision premise that failed, without mutating the graph.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing points, unrepresentable lifts, zero spans or duplicate outgoing directions fail explicitly; no branch, hole or edge is dropped to close a walk.
   * @evidence contracts/common.md#meaningful-documentation Documents that input must already be split and output is boundary incidence rather than kept-face triangulation.
   * @evidence contracts/performance.md#efficient-algorithms O(V+E+sum(d log d)) work and linear storage; the position table makes each successor lookup constant-time after sorting.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses lifted endpoints, angular lists and twin positions rather than rebuilding them for each walk.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All traversal maps/bitmaps expire on return; only fresh walk arrays escape, with no shared cache.
   */
  export function walks(
    vertices: ReadonlyMap<number, Point>,
    segments: readonly AutoMovieSolidMeshConstraints.ISegment[],
    period?: number,
  ): IWalk[] | string {
    if (period !== undefined && !(Number.isFinite(period) && period > 0))
      return "incidence period must be finite and positive";
    for (const entry of vertices) {
      const [id, point]: [number, Point] = entry;
      if (
        !Number.isSafeInteger(id) ||
        id < 0 ||
        point.length !== 2 ||
        !point.every(Number.isFinite)
      )
        return "incidence needs original nonnegative IDs and finite chart coordinates";
    }
    const halves: Halfedge[] = [];
    const around: Map<number, number[]> = new Map();
    for (const segment of segments) {
      const a: Point | undefined = vertices.get(segment.a);
      const b: Point | undefined = vertices.get(segment.b);
      if (
        a === undefined ||
        b === undefined ||
        !a.every(Number.isFinite) ||
        !b.every(Number.isFinite) ||
        !Number.isSafeInteger(segment.turn) ||
        (period === undefined && segment.turn !== 0)
      )
        return "incidence needs finite original endpoints and valid turns";
      const forward: Point = [b[0], b[1] + segment.turn * (period ?? 0)];
      const reverse: Point = [a[0], a[1] - segment.turn * (period ?? 0)];
      if (
        ![...forward, ...reverse].every(Number.isFinite) ||
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
      const origin: Point = vertices.get(vertex)!;
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
    const result: IWalk[] = [];
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
        if (!Number.isSafeInteger(winding))
          return "boundary winding is not a safe integer";
        edge = next[edge]!;
      }
      if (edge !== first)
        return "boundary incidences do not form disjoint successor cycles";
      result.push({ vertices: ids, lifts, winding });
    }
    return result;
  }
}

/** Counterclockwise direction order without atan2 ties or coordinate normalization. */
function order(origin: Point, a: Point, b: Point): number {
  const halfA: number =
    a[1] > origin[1] || (a[1] === origin[1] && a[0] >= origin[0]) ? 0 : 1;
  const halfB: number =
    b[1] > origin[1] || (b[1] === origin[1] && b[0] >= origin[0]) ? 0 : 1;
  if (halfA !== halfB) return halfA - halfB;
  return -orientAutoMovieSolidChart(origin, a, b);
}
