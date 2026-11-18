import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The base of support of a balance (`HumanFitBalance`) as half-planes: the
 * convex hull of the bearing points on the floor (Andrew's monotone chain),
 * and the half-planes whose intersection it is, each with the corners it
 * passes through, so a row can move the base with the corners' bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hull, the half-planes and why each names its corners.
 * @evidence contracts/development/design.md#principled-representation A convex polygon's half-planes, a segment's sides and caps, a point's axes, each with its corners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` and its records, read by `HumanFitBalance` alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No half-plane is dropped for a degenerate base.
 */
export namespace HumanFitBalanceBase {
  /**
   * Which corners a half-plane passes through: a side of the base (a
   * polygon's edge or a segment's side) the line through `p` and `q`, a cap
   * the line across the segment at its end `p` with `q` its other end, a
   * point's axis half-plane its one corner `p`.
   *
   * @evidence contracts/development/design.md#principled-representation The half-plane's kind and its corners' indices, what its signed distance is a function of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `of`; read by `slopes` and `at`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every half-plane `of` builds names its own corners; none is left fixed while its corners move.
   * @evidence contracts/development/common.md#meaningful-documentation States the three kinds and what `p` and `q` are in each.
   */
  export interface IThrough {
    /** The half-plane's kind. */
    kind: "side" | "cap" | "point";

    /** Its first corner; a cap's own end. */
    p: number;

    /** Its second corner; a cap's other end; `p` for a point. */
    q: number;
  }

  /**
   * The hull of floor points and its half-planes.
   *
   * @param points The bearing points, world metres; their heights are not read.
   * @returns The hull's corners, each with the index of the point it is, in hull order, and the half-planes over them.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Andrew's monotone-chain convex hull of the points' floor projections, then the half-planes that bound it: a polygon's edges, a segment's sides and end caps, or a point's four axis half-planes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection, one hull, one half-plane pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No half-plane is dropped or zeroed for a degenerate base.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P log P) for P points, O(H) for H half-planes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The corner mean is computed once for every edge's orientation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays and retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States the input, units and result order.
   */
  export function of(
    points: readonly IAutoMovieVector3[],
  ): IPlanes & { corners: ICorner[] } {
    const corners: ICorner[] = hull(
      points.map(
        (p: IAutoMovieVector3, i: number): ICorner => ({ x: p.x, z: p.z, i }),
      ),
    );
    return { ...halfPlanes(corners), corners };
  }

  /** The unit inward normal of a convex polygon's edge from corner `k` to the next; the monotone chain leaves no edge of zero length. */
  function inward(
    outline: readonly { x: number; z: number }[],
    k: number,
    middle: { x: number; z: number },
  ): { x: number; z: number } {
    const a: { x: number; z: number } = outline[k]!;
    const b: { x: number; z: number } = outline[(k + 1) % outline.length]!;
    const dx: number = b.x - a.x;
    const dz: number = b.z - a.z;
    const length: number = Math.hypot(dx, dz);
    const n: { x: number; z: number } = { x: -dz / length, z: dx / length };

    // The normal that points toward the outline's centroid, which a convex
    // outline holds inside, whichever way the corners run.
    return n.x * (middle.x - a.x) + n.z * (middle.z - a.z) >= 0
      ? n
      : { x: -n.x, z: -n.z };
  }

  /** The same ordered arithmetic mean of corners previously read independently for every edge. */
  function mean(outline: readonly { x: number; z: number }[]): {
    x: number;
    z: number;
  } {
    let x: number = 0;
    let z: number = 0;
    for (const p of outline) {
      x += p.x / outline.length;
      z += p.z / outline.length;
    }
    return { x, z };
  }

  /** Andrew's monotone chain on the caller's owned planar projection, sorted in place and traversed in both directions without a reversed copy; the corners kept are the caller's own records. */
  function hull<T extends { x: number; z: number }>(points: T[]): T[] {
    const sorted: T[] = points.sort(
      (a: T, b: T): number => a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn: (o: T, a: T, b: T) => number = (o: T, a: T, b: T): number =>
      (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain: (first: number, end: number, stride: 1 | -1) => T[] = (
      first: number,
      end: number,
      stride: 1 | -1,
    ): T[] => {
      const out: T[] = [];
      for (let i: number = first; i !== end; i += stride) {
        const p: T = sorted[i]!;
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const lower: T[] = chain(0, sorted.length, 1);
    const upper: T[] = chain(sorted.length - 1, -1, -1);
    for (const p of upper) lower.push(p);
    return lower;
  }

  /**
   * A corner of the hull: a floor point and the index of the bearing point it projects.
   *
   * @evidence contracts/development/design.md#principled-representation The floor coordinates the hull reads and the index that names the bearing point, so a corner is known as the point that rides its bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `of`, read by `HumanFitBalance.of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The index is the caller's own point order, never a re-derived identity.
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its units.
   */
  export interface ICorner {
    /** The floor point's x, world metres. */
    x: number;

    /** The floor point's z, world metres. */
    z: number;

    /** The index of the bearing point it projects. */
    i: number;
  }

  /**
   * A base's half-planes, in one order: each its anchor, its inward normal and the corners it passes through.
   *
   * @evidence contracts/development/design.md#principled-representation Three parallel arrays, one entry per half-plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `of`, read by `HumanFitBalance.of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every half-plane has all three entries.
   * @evidence contracts/development/common.md#meaningful-documentation States the three arrays and their shared order.
   */
  export interface IPlanes {
    /** A floor point each half-plane passes through, world metres. */
    anchors: { x: number; z: number }[];

    /** Each half-plane's unit inward direction. */
    normals: { x: number; z: number }[];

    /** Each half-plane's corners among the hull's. */
    through: IThrough[];
  }

  /**
   * The half-planes whose intersection is a convex hull of floor points: a
   * polygon's edges, each with its inward normal; a segment's two sides,
   * whose intersection is its line, and an inward cap at each end; a point's
   * four axis half-planes, which meet only at it. No hull has none but an
   * empty one, which bears nothing.
   */
  function halfPlanes(corners: readonly { x: number; z: number }[]): IPlanes {
    if (corners.length === 0) return { anchors: [], normals: [], through: [] };
    const a: { x: number; z: number } = corners[0]!;
    const b: { x: number; z: number } = corners[corners.length - 1]!;
    const span: number = Math.hypot(b.x - a.x, b.z - a.z);
    if (corners.length === 1 || (corners.length === 2 && span === 0))
      return {
        anchors: [a, a, a, a],
        normals: [
          { x: 1, z: 0 },
          { x: -1, z: 0 },
          { x: 0, z: 1 },
          { x: 0, z: -1 },
        ],
        through: [0, 1, 2, 3].map(
          (): IThrough => ({ kind: "point", p: 0, q: 0 }),
        ),
      };
    if (corners.length === 2) {
      const d: { x: number; z: number } = {
        x: (b.x - a.x) / span,
        z: (b.z - a.z) / span,
      };
      return {
        anchors: [a, a, a, b],
        normals: [
          { x: -d.z, z: d.x },
          { x: d.z, z: -d.x },
          d,
          { x: -d.x, z: -d.z },
        ],
        through: [
          { kind: "side", p: 0, q: 1 },
          { kind: "side", p: 0, q: 1 },
          { kind: "cap", p: 0, q: 1 },
          { kind: "cap", p: 1, q: 0 },
        ],
      };
    }
    const middle: { x: number; z: number } = mean(corners);
    return {
      anchors: [...corners],
      normals: corners.map(
        (_: { x: number; z: number }, k: number): { x: number; z: number } =>
          inward(corners, k, middle),
      ),
      through: corners.map(
        (_: { x: number; z: number }, k: number): IThrough => ({
          kind: "side",
          p: k,
          q: (k + 1) % corners.length,
        }),
      ),
    };
  }
}
