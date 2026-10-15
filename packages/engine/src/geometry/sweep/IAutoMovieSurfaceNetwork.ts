import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieSweep } from "./IAutoMovieSweep";

/**
 * A surface built from sweeps and curves and divided into four-sided patches,
 * which `sampleAutoMovieSurfaceNetwork` samples into one quad control cage at
 * any tier.
 *
 * Every patch is a grid in its own coordinates `(s, t)`, both from 0 to 1, and
 * its faces wind counterclockwise seen from outside when `s` runs to the right
 * and `t` up. Three rules fill a patch:
 *
 * - `sweep`: a rectangle of one sweep's `(u, v)` domain, with `s` along `v`
 *   and `t` along `u`. Patches of the same sweep that share a side share its
 *   vertices, so a sweep divided into patches around an opening stays one
 *   surface; a patch spanning a full turn of `v` closes on itself.
 * - `coons`: the bilinearly blended Coons patch of four boundary edges, each a
 *   network curve or a line of a sweep's domain, for regions bounded by a
 *   curve network, such as the ring of patches between a loop and the hole it
 *   surrounds. Neighbouring patches that name the same edge share it.
 * - `bridge`: rows of cubic Hermite curves between two closed loops of equal
 *   count, leaving the first loop and arriving at the second along stated
 *   directions, the explicit rule that blends a branch out of an opening or
 *   joins two sweeps.
 *
 * An opening is a region no patch covers. Its boundary stays a boundary of
 * the cage, which a bridge or a ring can then take up. Edges carry their
 * segment count per tier, and a patch's opposite sides must have equal
 * counts, so each tier has one fixed topology whatever the sweeps' shapes.
 * Positions are metres.
 *
 * @evidence contracts/common.md#principled-implementation A multi-block patch layout over a curve network, filled by evaluating the defining sweep, by Coons' bilinearly blended interpolation of four boundary curves, or by Hermite blending between two loops, with shared edges as the only coupling between patches.
 * @evidence contracts/common.md#clear-and-simple-design The network names its sweeps, nodes and curves once and patches refer to them by name, so a shared edge is one declaration that every neighbour samples identically.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts are declared per tier and checked; mismatched sides, open loops and edges that do not meet are refused by the sampler instead of being stitched.
 * @evidence contracts/common.md#meaningful-documentation States the patch coordinates and winding, each fill rule and its use, how openings and shared edges work, and the unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; sampling cost is answered on `sampleAutoMovieSurfaceNetwork`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record sampled once per tier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
 * @author Samchon
 */
export interface IAutoMovieSurfaceNetwork {
  /** Sweeps by name. */
  sweeps: Record<string, IAutoMovieSweep>;

  /** Points curves start and end at, by name; omitted, none. */
  nodes?: Record<string, IAutoMovieSurfaceNetwork.INode>;

  /** Curves between nodes, by name; omitted, none. */
  curves?: Record<string, IAutoMovieSurfaceNetwork.ICurve>;

  /** The patches, in the order their faces are emitted; bridges are filled after every other patch. */
  patches: IAutoMovieSurfaceNetwork.IPatch[];

  /** Closed loops whose vertices are reported, and optionally pinned, such as a junction a neighbouring part shares; omitted, none. */
  rings?: IAutoMovieSurfaceNetwork.IRing[];
}
export namespace IAutoMovieSurfaceNetwork {
  /**
   * Segment count by tier.
   *
   * @author Samchon
   */
  export type ICounts = Record<AutoMovieSurfaceTier, number>;

  /**
   * A node: a free point, or a point of a sweep's domain so curves meet the sweep exactly.
   *
   * @author Samchon
   */
  export type INode = IFreeNode | ISweepNode;

  /**
   * A node at a position.
   *
   * @author Samchon
   */
  export interface IFreeNode {
    /** Discriminator. */
    type: "point";

    /** Metres. */
    position: IAutoMovieVector3;
  }

  /**
   * A node on a sweep.
   *
   * @author Samchon
   */
  export interface ISweepNode {
    /** Discriminator. */
    type: "sweep";

    /** Name of the sweep. */
    sweep: string;

    /** Along the sweep's spine, 0 to 1. */
    u: number;

    /** Around it, any real number, read modulo 1. */
    v: number;
  }

  /**
   * A curve from one node to another through optional points: the centripetal Catmull-Rom spline through them all, sampled by chord-length share. At a node on a sweep the curve leaves or arrives in the sweep's tangent plane: its end direction is the spline's own less the part along the sweep's normal, so a curve on the surface meets the sweep without a kink.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** Start node. */
    from: string;

    /** End node, different from the start. */
    to: string;

    /** Points between, metres; omitted, the curve is the straight segment between the nodes. */
    through?: IAutoMovieVector3[];

    /** Segments by tier, positive integers. */
    segments: ICounts;

    /** Direction a bridge leaves or enters the curve along, needed only when the curve is part of a bridge loop whose tangent rule is not `across`. */
    direction?: IAutoMovieVector3;

    /** Normal of the surface the bridges make along the curve, needed only when the curve is part of a bridge loop with the `across` rule: a bridge then leaves the curve along this normal crossed with the loop's direction, so two bridges that run along the curve in opposite directions leave it to opposite sides and meet there with one tangent plane, a saddle. The normal holds at the curve's middle; toward an end node on a sweep it turns linearly to that sweep's own normal there, so the bridges also leave the sweep's edge and the curve with one continuous direction field. */
    normal?: IAutoMovieVector3;
  }

  /**
   * A patch side or loop piece: a line of a sweep's domain or a network curve.
   *
   * @author Samchon
   */
  export type IEdge = ISweepEdge | ICurveEdge;

  /**
   * The straight line between two points of a sweep's `(u, v)` domain, sampled evenly in the domain. `v` may run past 1 or below 0 to cross the sweep's seam.
   *
   * @author Samchon
   */
  export interface ISweepEdge {
    /** Discriminator. */
    type: "sweep";

    /** Name of the sweep. */
    sweep: string;

    /** Start, `u` from 0 to 1. */
    from: IDomainPoint;

    /** End, `u` from 0 to 1. */
    to: IDomainPoint;

    /** Segments by tier, positive integers. */
    segments: ICounts;
  }

  /**
   * A point of a sweep's domain.
   *
   * @author Samchon
   */
  export interface IDomainPoint {
    /** Along the spine. */
    u: number;

    /** Around it. */
    v: number;
  }

  /**
   * A network curve, forward from its start node or reversed.
   *
   * @author Samchon
   */
  export interface ICurveEdge {
    /** Discriminator. */
    type: "curve";

    /** Name of the curve. */
    curve: string;

    /** Whether the edge runs from the curve's end node to its start; omitted, forward. */
    reverse?: boolean;
  }

  /**
   * One patch.
   *
   * @author Samchon
   */
  export type IPatch = ISweepPatch | ICoonsPatch | IBridgePatch;

  /**
   * A rectangle of a sweep's domain.
   *
   * @author Samchon
   */
  export interface ISweepPatch {
    /** Discriminator. */
    type: "sweep";

    /** Name unique among the patches. */
    name: string;

    /** Name of the sweep. */
    sweep: string;

    /** Range of `u`, increasing, within 0 to 1; `t` runs along it. */
    u: [number, number];

    /** Range of `v`, increasing, at most one turn; `s` runs along it. */
    v: [number, number];

    /** Faces along `t` by tier. */
    rows: ICounts;

    /** Faces along `s` by tier. */
    columns: ICounts;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IUvRect;
  }

  /**
   * A patch bounded by four edges, filled by the Coons patch of its boundary.
   *
   * @author Samchon
   */
  export interface ICoonsPatch {
    /** Discriminator. */
    type: "coons";

    /** Name unique among the patches. */
    name: string;

    /**
     * The boundary counterclockwise from outside: the bottom from `s` 0 to 1 at `t` 0, the right side from `t` 0 to 1, the top from `s` 1 to 0 and the left side from `t` 1 to 0, each ending where the next begins. Opposite sides have equal counts.
     */
    sides: [IEdge, IEdge, IEdge, IEdge];

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IUvRect;
  }

  /**
   * Rows of Hermite curves from one loop to another.
   *
   * Loop point `k` of `from` joins loop point `k` of `to`; both loops run counterclockwise about the direction of travel from `from` to `to`, and have the same count. Column `k` is `H(t) = h00 A + h10 m T_A + h01 B + h11 m T_B` with the cubic Hermite basis, unit directions `T_A` leaving `A` and `T_B` arriving at `B`, and `m = tension * |B - A|`.
   *
   * @author Samchon
   */
  export interface IBridgePatch {
    /** Discriminator. */
    type: "bridge";

    /** Name unique among the patches. */
    name: string;

    /** The loop the rows leave. */
    from: ILoop;

    /** The loop the rows arrive at. */
    to: ILoop;

    /** Faces along `t` by tier. */
    rows: ICounts;

    /** Tangent length over chord length; omitted, 1. */
    tension?: number;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IUvRect;
  }

  /**
   * A closed loop of edges and the direction a bridge travels at it.
   *
   * @author Samchon
   */
  export interface ILoop {
    /** Edges in order, each starting where the previous ends, the last ending where the first starts. Their points must already belong to sweep or Coons patches. */
    edges: IEdge[];

    /**
     * Direction of travel at the loop: `normal` and `inward` along or against a sweep's outward normal, `forward` and `backward` along or against its spine (`+u` or `-u`), and `across` within the sweep's tangent plane perpendicular to the loop, `N x L` for the outward normal `N` and the loop's direction `L` at the point, which points into the region the loop encloses when the loop runs counterclockwise about `N`. `across` leaves an opening tangent to the surface around it, so the bridge continues that surface with a continuous tangent plane, where `normal` turns a right angle at the opening's edge. Points of a curve edge take the curve's `normal` as `N` under `across` and the curve's `direction` under every other rule.
     */
    tangent: "normal" | "inward" | "forward" | "backward" | "across";
  }

  /**
   * A closed loop of edges reported by name, such as the opening a neighbour joins.
   *
   * @author Samchon
   */
  export interface IRing {
    /** Name unique among the rings. */
    name: string;

    /** Edges in order, closed, whose points belong to patches. */
    edges: IEdge[];

    /** Control positions the loop's vertices take, in loop order, metres; they are kept as given and not fitted. Omitted, the vertices are fitted like any other. */
    positions?: IAutoMovieVector3[];
  }

  /**
   * A patch's rectangle in texture space; `s` maps linearly onto the first range and `t` onto the second.
   *
   * @author Samchon
   */
  export interface IUvRect {
    /** Texture `u` at `s` 0 and 1. */
    s: [number, number];

    /** Texture `v` at `t` 0 and 1. */
    t: [number, number];
  }
}
