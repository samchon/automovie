import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanWebPatch as Patch } from "./AutoMovieHumanWebPatch";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/** Shared web topology records and regular curve arithmetic. */
export namespace AutoMovieHumanWebGeometry {
  /** One child's share of the parent's ring. */
  export interface IShare {
    /** Child chain name. */
    name: string;

    /** Its arcs as parent ring vertices, inclusive, in ring order. */
    arcs: number[][];
  }

  /** What a web needs from the surface being built. */
  export interface IInput {
    /** Skin buffers. */
    mesh: AutoMovieHumanLoftMesh.IContext;

    /** Loft coordinates of every vertex, grown with each new vertex. */
    coordinates: number[];

    /** Chain by name. */
    chain: (name: string) => IAutoMovieHumanLoftChain;

    /** Calibration index of a chain. */
    index: (name: string) => number;

    /** Parent chain. */
    parent: IAutoMovieHumanLoftChain;

    /** Whether the children lie below the parent's bottom ring. */
    down: boolean;

    /** Parent phase of each vertex of its ring. */
    phase: Map<number, number>;

    /** Every child's share. */
    shares: IShare[];
  }

  /** A built web. */
  export interface IResult {
    /** Each child's adjacent end: the vertices of its section, in ring order. */
    rings: Map<string, number[]>;

    /** The webs' separatrices, the lips and each child's own column, as the surface sampled them. */
    construction: IAutoMovieHumanConstructionPath[];
  }

  /** A web between two children. */
  export interface IWeb {
    /** Its pinches, lower vertex first. */
    first: number;
    /** The other pinch's shared parent vertex index. */
    second: number;
    /** First pinch position in world millimetres. */
    A: Vec3;
    /** Second pinch position in world millimetres. */
    B: Vec3;

    /** Unit from the first pinch to the second. */
    xi: Vec3;

    /** Unit along the parent's surface past the pinches, square to xi. */
    ea: Vec3;

    /** Radius of the round margin, half the pinches' chord. */
    rho: number;

    /** The crest. */
    S: Vec3;

    /** Each pinch's lip vertices from the pinch to the crest. */
    lips: Map<number, number[]>;

    /** The crest's vertex. */
    crest: number;

    /** Each child's own column. */
    children: Map<string, IWebChild>;
    /** Shared parent-to-crest curves keyed by the pinch side. */
    lip: Map<number, (t: number) => Vec3>;
  }

  /** A web's column down one child. */
  export interface IWebChild {
    /** Phase where it meets the child's section. */
    phi: number;
    /** Child section arrival in world millimetres. */
    q: Vec3;

    /** Depth of its arrival past the crest. */
    depth: number;

    /** Crest-to-child curve at a direct parameter in [0,1]. */
    own: (parameter: number) => Vec3;
    /** Child surface's directed physical station jet. */
    jet: Patch.IJet;

    /** Its vertices from the crest to the section. */
    rows: number[];
  }

  /** A column down a child. */
  export type IColumn =
    | {
        /** A shared separatrix whose vertices belong to both children. */
        kind: "pinch";
        /** Parent pinch vertex index. */
        v: number;
        /** Owner of the shared lip and saddle crest. */
        web: IWeb;
      }
    | {
        /** An interior column between the shared separatrices. */
        kind: "plain";
        /** Owned vertex at the parent ring. */
        v: number;
        /** Parent arrival position in world millimetres. */
        p: Vec3;
        /** Parent surface's unit outward station tangent. */
        o: Vec3;
        /** Child arrival position in world millimetres. */
        q: Vec3;
        /** Child surface's unit inward station tangent. */
        d: Vec3;
        /** Arrival phase on the child's section in radians. */
        phi: number;
        /** Nearest saddle used by this column's local chart. */
        web: IWeb;
        /** Minus or plus side of that saddle's margin. */
        side: number;
        /** Ring distance from the pinch in margin radii. */
        y: number;
        /** Margin radius interpolated across the parent arc, millimetres. */
        rho: number;
        /** Parent physical station derivatives directed toward the child. */
        parentJet: Patch.IJet;
        /** Child physical station derivatives directed into the child. */
        childJet: Patch.IJet;
      };

  /** A child and its columns. */
  export interface IChild {
    /** Child chain's stable calibration name. */
    name: string;
    /** Child surface owning the final ring. */
    chain: IAutoMovieHumanLoftChain;
    /** Child end station in millimetres. */
    station: number;
    /** Ring-ordered columns, including duplicated shared separatrices. */
    columns: IColumn[];
  }

  /** World-space point or displacement in millimetres. */
  export type Vec3 = Patch.Vec3;

  /**
   * A curve read by its depth along a direction from its start: the point where
   * it first reaches a depth, so a web's rows are level sets of that depth. A
   * curve that leaves its start across the direction (a saddle's own column)
   * reaches its first depths at their square root. Past its ends it runs on
   * along its end tangents.
   */
  export function sampled(
    curve: (u: number) => Vec3,
    direction: Vec3,
  ): (depth: number) => Vec3 {
    const samples: Vec3[] = Array.from(
      { length: LEVEL_SAMPLES + 1 },
      (_: unknown, i: number): Vec3 => curve(i / LEVEL_SAMPLES),
    );
    const start: Vec3 = samples[0]!;
    const depth: number[] = samples.map((p: Vec3): number =>
      dot(sub(p, start), direction),
    );

    // Depth never falls back along a column: hold its running maximum.
    for (let i: number = 1; i <= LEVEL_SAMPLES; i++)
      depth[i] = Math.max(depth[i]!, depth[i - 1]!);
    const end: number = depth[LEVEL_SAMPLES]!;
    const along: (i: number, j: number) => Vec3 = (
      i: number,
      j: number,
    ): Vec3 => unit(sub(samples[j]!, samples[i]!));
    return (goal: number): Vec3 => {
      if (goal <= 0) return start;
      if (goal >= end) {
        const t: Vec3 = along(LEVEL_SAMPLES - 1, LEVEL_SAMPLES);
        return add(
          samples[LEVEL_SAMPLES]!,
          scale(t, (goal - end) / Math.max(0.2, dot(t, direction))),
        );
      }
      let lo: number = 0;
      let hi: number = LEVEL_SAMPLES;
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (depth[mid]! < goal) lo = mid;
        else hi = mid;
      }

      // At 256 table cells, 36 bisections bound parameter error below 6e-14.
      // Chord inversion at the first cell loses the saddle's square-root speed.
      let a: number = lo / LEVEL_SAMPLES;
      let b: number = hi / LEVEL_SAMPLES;
      for (let i: number = 0; i < 36; i++) {
        const middle: number = (a + b) / 2;
        if (dot(sub(curve(middle), start), direction) < goal) a = middle;
        else b = middle;
      }
      return curve((a + b) / 2);
    };
  }

  /** Cubic Hermite from a to b with end tangents ta, tb, at u in [0, 1]. */
  export function hermite(
    a: Vec3,
    ta: Vec3,
    b: Vec3,
    tb: Vec3,
    u: number,
  ): Vec3 {
    const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = u ** 3 - 2 * u ** 2 + u;
    const h01: number = -2 * u ** 3 + 3 * u ** 2;
    const h11: number = u ** 3 - u ** 2;
    return [0, 1, 2].map(
      (k: number): number =>
        h00 * a[k]! + h10 * ta[k]! + h01 * b[k]! + h11 * tb[k]!,
    ) as Vec3;
  }

  /** Sum two Cartesian vectors without changing their frame. */
  export function add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Displacement from b to a in their common Cartesian frame. */
  export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Multiply a vector by a dimensionless signed scale. */
  export function scale(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Cartesian scalar product, used to measure directed depth. */
  export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Euclidean length in the vector's units. */
  export function norm(a: Vec3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit direction; a zero vector remains zero. */
  export function unit(a: Vec3): Vec3 {
    return scale(a, 1 / (norm(a) || 1));
  }

  /** Clamped quintic whose first two derivatives vanish at both ends. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t ** 3 * (10 - 15 * t + 6 * t * t);
  }

  /** An angle brought into (-pi, pi]. */
  export function wrapPi(a: number): number {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  /** A whole turn. */
  export const TWO_PI: number = 2 * Math.PI;

  /** Phases of a child's section read for its angles. */
  export const TABLE: number = 2048;

  /** Margin radii from a pinch over which a column leaves the saddle's chart. */
  export const FADE: number = 3;

  /**
   * A cell's side about a crest in margin radii: the dihedral across it is about
   * as many radians at the saddle's own radius.
   */
  export const CELL: number = 0.35;

  /** Rows below a crest over which its levels close as the square of the row. */
  export const CREST_ROWS: number = 2;

  /** Samples of a column read for its levels. */
  const LEVEL_SAMPLES: number = 256;
}
