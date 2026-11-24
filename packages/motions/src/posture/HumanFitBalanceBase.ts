import type { IAutoMovieVector3 } from "@automovie/interface";

/** The record of `IHalfPlanes2`'s site. */
type IHalfPlanes2 = { x: number; z: number };

/** The record of `IHalfPlanesResult`'s site. */
type IHalfPlanesResult = { x: number; z: number };

/** The record of `IHalfPlanes`'s site. */
type IHalfPlanes = { x: number; z: number };

/** The record of `IHalfPlanesMiddle`'s site. */
type IHalfPlanesMiddle = { x: number; z: number };

/** The record of `IHalfPlanesD`'s site. */
type IHalfPlanesD = { x: number; z: number };

/** The record of `IHalfPlanesB`'s site. */
type IHalfPlanesB = { x: number; z: number };

/** The record of `IHalfPlanesA`'s site. */
type IHalfPlanesA = { x: number; z: number };

/** The record of `IHalfPlanesCornersItem`'s site. */
type IHalfPlanesCornersItem = { x: number; z: number };

/** The record of `IPlanesNormalsItem`'s site. */
type IPlanesNormalsItem = { x: number; z: number };

/** The record of `IPlanesAnchorsItem`'s site. */
type IPlanesAnchorsItem = { x: number; z: number };

/** The alternatives of `HullChainStride2`'s site. */
type HullChainStride2 = 1 | -1;

/** The alternatives of `HullChainStride`'s site. */
type HullChainStride = 1 | -1;

/** The record of `IHull`'s site. */
type IHull = { x: number; z: number };

/** The record of `IMeanResult`'s site. */
type IMeanResult = {
  x: number;
  z: number;
};

/** The record of `IMeanOutlineItem`'s site. */
type IMeanOutlineItem = { x: number; z: number };

/** The record of `IInwardN`'s site. */
type IInwardN = { x: number; z: number };

/** The record of `IInwardB`'s site. */
type IInwardB = { x: number; z: number };

/** The record of `IInwardA`'s site. */
type IInwardA = { x: number; z: number };

/** The record of `IInwardResult`'s site. */
type IInwardResult = { x: number; z: number };

/** The record of `IInwardMiddle`'s site. */
type IInwardMiddle = { x: number; z: number };

/** The record of `IInwardOutlineItem`'s site. */
type IInwardOutlineItem = { x: number; z: number };

/** The alternatives of `ThroughKind`'s site. */
type ThroughKind = "side" | "cap" | "point";

/**
 * The base of support of a balance (`HumanFitBalance`) as half-planes: the
 * convex hull of the bearing points on the floor (Andrew's monotone chain), and
 * the half-planes whose intersection it is, each with the corners it passes
 * through, so a row can move the base with the corners' bones.
 */
export namespace HumanFitBalanceBase {
  /**
   * Which corners a half-plane passes through: a side of the base (a polygon's
   * edge or a segment's side) the line through `p` and `q`, a cap the line
   * across the segment at its end `p` with `q` its other end, a point's axis
   * half-plane its one corner `p`.
   */
  export interface IThrough {
    /** The half-plane's kind. */
    kind: ThroughKind;

    /** Its first corner; a cap's own end. */
    p: number;

    /** Its second corner; a cap's other end; `p` for a point. */
    q: number;
  }
  /** The record of `IOfResult`'s site. */
  type IOfResult = { corners: ICorner[] };

  /**
   * The hull of floor points and its half-planes.
   *
   * @param points The bearing points, world metres; their heights are not read.
   * @returns The hull's corners, each with the index of the point it is, in
   *   hull order, and the half-planes over them.
   */
  export function of(
    points: readonly IAutoMovieVector3[],
  ): IPlanes & IOfResult {
    const corners: ICorner[] = hull(
      points.map(
        (p: IAutoMovieVector3, i: number): ICorner => ({ x: p.x, z: p.z, i }),
      ),
    );
    return { ...halfPlanes(corners), corners };
  }

  /**
   * The unit inward normal of a convex polygon's edge from corner `k` to the
   * next; the monotone chain leaves no edge of zero length.
   */
  function inward(
    outline: readonly IInwardOutlineItem[],
    k: number,
    middle: IInwardMiddle,
  ): IInwardResult {
    const a: IInwardA = outline[k]!;
    const b: IInwardB = outline[(k + 1) % outline.length]!;
    const dx: number = b.x - a.x;
    const dz: number = b.z - a.z;
    const length: number = Math.hypot(dx, dz);
    const n: IInwardN = { x: -dz / length, z: dx / length };

    // The normal that points toward the outline's centroid, which a convex
    // outline holds inside, whichever way the corners run.
    return n.x * (middle.x - a.x) + n.z * (middle.z - a.z) >= 0
      ? n
      : { x: -n.x, z: -n.z };
  }

  /**
   * The same ordered arithmetic mean of corners previously read independently
   * for every edge.
   */
  function mean(outline: readonly IMeanOutlineItem[]): IMeanResult {
    let x: number = 0;
    let z: number = 0;
    for (const p of outline) {
      x += p.x / outline.length;
      z += p.z / outline.length;
    }
    return { x, z };
  }

  /**
   * Andrew's monotone chain on the caller's owned planar projection, sorted in
   * place and traversed in both directions without a reversed copy; the corners
   * kept are the caller's own records.
   */
  function hull<T extends IHull>(points: T[]): T[] {
    const sorted: T[] = points.sort(
      (a: T, b: T): number => a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn: (o: T, a: T, b: T) => number = (o: T, a: T, b: T): number =>
      (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain: (
      first: number,
      end: number,
      stride: HullChainStride,
    ) => T[] = (first: number, end: number, stride: HullChainStride2): T[] => {
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
   * A corner of the hull: a floor point and the index of the bearing point it
   * projects.
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
   * A base's half-planes, in one order: each its anchor, its inward normal and
   * the corners it passes through.
   */
  export interface IPlanes {
    /** A floor point each half-plane passes through, world metres. */
    anchors: IPlanesAnchorsItem[];

    /** Each half-plane's unit inward direction. */
    normals: IPlanesNormalsItem[];

    /** Each half-plane's corners among the hull's. */
    through: IThrough[];
  }

  /**
   * The half-planes whose intersection is a convex hull of floor points: a
   * polygon's edges, each with its inward normal; a segment's two sides, whose
   * intersection is its line, and an inward cap at each end; a point's four
   * axis half-planes, which meet only at it. No hull has none but an empty one,
   * which bears nothing.
   */
  function halfPlanes(corners: readonly IHalfPlanesCornersItem[]): IPlanes {
    if (corners.length === 0) return { anchors: [], normals: [], through: [] };
    const a: IHalfPlanesA = corners[0]!;
    const b: IHalfPlanesB = corners[corners.length - 1]!;
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
      const d: IHalfPlanesD = {
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
    const middle: IHalfPlanesMiddle = mean(corners);
    return {
      anchors: [...corners],
      normals: corners.map(
        (_: IHalfPlanes, k: number): IHalfPlanesResult =>
          inward(corners, k, middle),
      ),
      through: corners.map(
        (_: IHalfPlanes2, k: number): IThrough => ({
          kind: "side",
          p: k,
          q: (k + 1) % corners.length,
        }),
      ),
    };
  }
}
