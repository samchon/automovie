import type { IAutoMovieVector3 } from "./IAutoMovieVector3";
import type { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import type { IAutoMovieSweep } from "./IAutoMovieSweep";

/**
 * A surface built from sweeps and curves and divided into four-sided patches,
 * which `sampleAutoMovieSurfaceNetwork` samples into one quad control cage at
 * any tier.
 *
 * Every patch is a grid in its own coordinates `(s, t)`, both from 0 to 1, and
 * its faces wind counterclockwise seen from outside when `s` runs to the right
 * and `t` up. Four rules fill a patch:
 *
 * - `sweep`: a rectangle of one sweep's `(u, v)` domain, with `s` along `v` and
 *   `t` along `u`. Patches of the same sweep that share a side share its
 *   vertices, so a sweep divided into patches around an opening stays one
 *   surface; a patch spanning a full turn of `v` closes on itself.
 * - `coons`: the bilinearly blended Coons patch of four boundary edges, each a
 *   network curve or a line of a sweep's domain, for regions bounded by a curve
 *   network, such as the ring of patches between a loop and the hole it
 *   surrounds. Neighbouring patches that name the same edge share it.
 * - `bridge`: rows of cubic Hermite curves between two closed loops of equal
 *   count, leaving the first loop and arriving at the second along stated
 *   directions, the explicit rule that blends a branch out of an opening or
 *   joins two sweeps.
 * - `transition`: a band of a sweep's domain whose column count changes from its
 *   start ring to its end ring by 2-to-1 quad reduction strips, the way a tube
 *   gains or sheds columns along its length; extraordinary vertices can still
 *   perturb its limit curvature.
 *
 * An opening is a region no patch covers. Its boundary stays a boundary of the
 * cage, which a bridge or a ring can then take up. Edges carry their segment
 * count per tier, and a patch's opposite sides must have equal counts, so each
 * tier has one fixed topology whatever the sweeps' shapes. Positions are
 * metres.
 */
export interface IAutoMovieSurfaceNetwork {
  /** Sweeps by name. */
  sweeps: Record<string, IAutoMovieSweep>;

  /** Points curves start and end at, by name; omitted, none. */
  nodes?: Record<string, IAutoMovieSurfaceNetwork.INode>;

  /** Curves between nodes, by name; omitted, none. */
  curves?: Record<string, IAutoMovieSurfaceNetwork.ICurve>;

  /**
   * The patches, in the order their faces are emitted; bridges are filled after
   * every other patch.
   */
  patches: IAutoMovieSurfaceNetwork.IPatch[];

  /**
   * Closed loops whose vertices are reported, and optionally pinned, such as a
   * junction a neighbouring part shares; omitted, none.
   */
  rings?: IAutoMovieSurfaceNetwork.IRing[];
}

/** Data and callback contracts shared by the SurfaceNetwork operations. */
export namespace IAutoMovieSurfaceNetwork {
  /** Segment count by tier. */
  export type ICounts = Record<AutoMovieSurfaceTier, number>;

  /**
   * A node: a free point, or a point of a sweep's domain so curves meet the
   * sweep exactly.
   */
  export type INode =
    | IAutoMovieSurfaceNetwork.IFreeNode
    | IAutoMovieSurfaceNetwork.ISweepNode;

  /** A node at a position. */
  export interface IFreeNode {
    /** Discriminator. */
    type: "point";

    /** Metres. */
    position: IAutoMovieVector3;
  }

  /** A node on a sweep. */
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
   * A curve from one node to another through optional points: the centripetal
   * Catmull-Rom spline through them all, sampled by chord-length share. At a
   * node on a sweep the curve leaves or arrives in the sweep's tangent plane:
   * its end direction is the spline's own less the part along the sweep's
   * normal, so its generating endpoint tangent lies in that plane. Cell
   * averaging and subdivision remain separate; this is not a final-skin normal
   * guarantee.
   */
  export interface ICurve {
    /** Start node. */
    from: string;

    /** End node, different from the start. */
    to: string;

    /**
     * Points between, metres; omitted, the curve is the straight segment
     * between the nodes.
     */
    through?: IAutoMovieVector3[];

    /** Segments by tier, positive integers. */
    segments: IAutoMovieSurfaceNetwork.ICounts;

    /**
     * Direction a bridge leaves or enters the curve along, needed only when the
     * curve is part of a bridge loop whose tangent rule is not `across`.
     */
    direction?: IAutoMovieVector3;

    /**
     * Normal of the surface the bridges make along the curve, needed only when
     * the curve is part of a bridge loop with the `across` rule: a bridge then
     * leaves the curve along this normal crossed with the loop's direction, so
     * opposite loop directions supply opposite cross-boundary input tangents.
     * This constrains the generating rows rather than certifying the final
     * subdivision normals. The normal holds at the curve's middle; toward an
     * end node on a sweep it turns linearly to that sweep's own normal there,
     * which supplies a continuous normal-hint field where the interpolated
     * vector is nonzero.
     */
    normal?: IAutoMovieVector3;
  }

  /** A patch side or loop piece: a line of a sweep's domain or a network curve. */
  export type IEdge =
    | IAutoMovieSurfaceNetwork.ISweepEdge
    | IAutoMovieSurfaceNetwork.ICurveEdge;

  /**
   * The straight line between two points of a sweep's `(u, v)` domain, sampled
   * evenly in the domain. `v` may run past 1 or below 0 to cross the sweep's
   * seam.
   */
  export interface ISweepEdge {
    /** Discriminator. */
    type: "sweep";

    /** Name of the sweep. */
    sweep: string;

    /** Start, `u` from 0 to 1. */
    from: IAutoMovieSurfaceNetwork.IDomainPoint;

    /** End, `u` from 0 to 1. */
    to: IAutoMovieSurfaceNetwork.IDomainPoint;

    /** Segments by tier, positive integers. */
    segments: IAutoMovieSurfaceNetwork.ICounts;
  }

  /** A point of a sweep's domain. */
  export interface IDomainPoint {
    /** Along the spine. */
    u: number;

    /** Around it. */
    v: number;
  }

  /** A network curve, forward from its start node or reversed. */
  export interface ICurveEdge {
    /** Discriminator. */
    type: "curve";

    /** Name of the curve. */
    curve: string;

    /**
     * Whether the edge runs from the curve's end node to its start; omitted,
     * forward.
     */
    reverse?: boolean;
  }

  /** One patch. */
  export type IPatch =
    | IAutoMovieSurfaceNetwork.ISweepPatch
    | IAutoMovieSurfaceNetwork.ICoonsPatch
    | IAutoMovieSurfaceNetwork.IBridgePatch
    | IAutoMovieSurfaceNetwork.ITransitionPatch;

  /** A rectangle of a sweep's domain. */
  export interface ISweepPatch {
    /** Discriminator. */
    type: "sweep";

    /** Name unique among the patches. */
    name: string;

    /** Name of the sweep. */
    sweep: string;

    /**
     * Increasing range of `u` within 0 to 1; `t` runs from `start` to `end`.
     */
    u: IAutoMovieSurfaceNetwork.IParameterRange;

    /**
     * Increasing range of `v`, at most one turn; `s` runs from `start` to `end`.
     */
    v: IAutoMovieSurfaceNetwork.IParameterRange;

    /** Faces along `t` by tier. */
    rows: IAutoMovieSurfaceNetwork.ICounts;

    /** Faces along `s` by tier. */
    columns: IAutoMovieSurfaceNetwork.ICounts;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IAutoMovieSurfaceNetwork.IUvRect;
  }

  /** Increasing start and end of a patch's parameter range. */
  export interface IParameterRange {
    /** Range start. */
    start: number;

    /** Range end, greater than `start`. */
    end: number;
  }

  /**
   * A band of a sweep's domain whose column count changes across it, so a sweep
   * can carry more columns where it needs detail, such as a groove, and fewer
   * where it meets a coarser ring.
   *
   * The band runs from its start ring at `u.start` to its end ring at `u.end`
   * in `rows` even rows, with `start` columns evenly spaced round the first ring
   * and `end` round the last, so it welds onto sweep patches of those counts on
   * either side. Give it rows so its middle row is about as tall as a coarse
   * column is wide: on a cylinder going from 8 to 16 columns, a middle row half
   * that tall bends the limit normal round the poles by 8 degrees instead of 5.
   * Its middle row reduces the finer ring to the coarser by `(fine - coarse) /
   * 2` blocks of the 2-to-1 quad reduction strip, each turning four fine
   * columns into two coarse columns through six quads with two interior poles
   * of valence three half-way across the row; every other column passes
   * straight through, and rows before the middle keep the start count and rows
   * after it the end count. The fine ring stays regular; the coarse ring
   * vertices at the blocks' corners take valence five beside a straight column
   * and six between two blocks. Blocks spread evenly round the band and mirror
   * with it, as `layoutAutoMovieSurfaceTransition` states. Vertices sample the
   * sweep with the rig's cell averaging. With fitting enabled, free limit
   * vertices interpolate those filtered targets; the surface between them still
   * depends on subdivision topology; put the band where the sweep is gently
   * curved along `u`, because its poles carry the most curvature error, and
   * narrow its `v` range to keep them off a region, splitting the ring into
   * several bands.
   *
   * Counts must differ by an even number, the finer at most twice the coarser,
   * so a larger change chains two bands; equal counts give plain rows. The
   * patch's `(s, t)` coordinates run along `v` and `u` as a sweep patch's do,
   * but its faces are not a grid: each face's corners carry their own
   * coordinates.
   */
  export interface ITransitionPatch {
    /** Discriminator. */
    type: "transition";

    /** Name unique among the patches. */
    name: string;

    /** Name of the sweep. */
    sweep: string;

    /**
     * Range of `u`, increasing, within 0 to 1: the start ring and the end ring;
     * `t` runs along it.
     */
    u: IAutoMovieSurfaceNetwork.IParameterRange;

    /**
     * Increasing range of `v`, at most one turn; `s` runs from `start` to `end`.
     */
    v: IAutoMovieSurfaceNetwork.IParameterRange;

    /** Columns along the start ring by tier. */
    start: IAutoMovieSurfaceNetwork.ICounts;

    /** Columns along the end ring by tier. */
    end: IAutoMovieSurfaceNetwork.ICounts;

    /** Rows across the band by tier; the middle one changes the count. */
    rows: IAutoMovieSurfaceNetwork.ICounts;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IAutoMovieSurfaceNetwork.IUvRect;
  }

  /** A patch bounded by four edges, filled by the Coons patch of its boundary. */
  export interface ICoonsPatch {
    /** Discriminator. */
    type: "coons";

    /** Name unique among the patches. */
    name: string;

    /**
     * The boundary counterclockwise from outside: the bottom from `s` 0 to 1 at
     * `t` 0, the right side from `t` 0 to 1, the top from `s` 1 to 0 and the
     * left side from `t` 1 to 0, each ending where the next begins. Opposite
     * sides have equal counts.
     */
    sides: [
      IAutoMovieSurfaceNetwork.IEdge,
      IAutoMovieSurfaceNetwork.IEdge,
      IAutoMovieSurfaceNetwork.IEdge,
      IAutoMovieSurfaceNetwork.IEdge,
    ];

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IAutoMovieSurfaceNetwork.IUvRect;
  }

  /**
   * Rows of Hermite curves from one loop to another.
   *
   * Loop point `k` of `from` joins loop point `k` of `to`; both loops run
   * counterclockwise about the direction of travel from `from` to `to`, and
   * have the same count. Column `k` is `H(t) = h00 A + h10 m T_A + h01 B + h11
   * m T_B` with the cubic Hermite basis, unit directions `T_A` leaving `A` and
   * `T_B` arriving at `B`, and `m = tension * |B - A|`.
   */
  export interface IBridgePatch {
    /** Discriminator. */
    type: "bridge";

    /** Name unique among the patches. */
    name: string;

    /** The loop the rows leave. */
    from: IAutoMovieSurfaceNetwork.ILoop;

    /** The loop the rows arrive at. */
    to: IAutoMovieSurfaceNetwork.ILoop;

    /** Faces along `t` by tier. */
    rows: IAutoMovieSurfaceNetwork.ICounts;

    /** Tangent length over chord length; omitted, 1. */
    tension?: number;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IAutoMovieSurfaceNetwork.IUvRect;
  }

  /** A closed loop of edges and the direction a bridge travels at it. */
  export interface ILoop {
    /**
     * Edges in order, each starting where the previous ends, the last ending
     * where the first starts. Their points must already belong to sweep or
     * Coons patches.
     */
    edges: IAutoMovieSurfaceNetwork.IEdge[];

    /**
     * Direction of travel at the loop: `normal` and `inward` along or against a
     * sweep's outward normal, `forward` and `backward` along or against its
     * spine (`+u` or `-u`), and `across` within the sweep's tangent plane
     * perpendicular to the loop, `N x L` for the outward normal `N` and the
     * loop's direction `L` at the point, which points into the region the loop
     * encloses when the loop runs counterclockwise about `N`. `across` places
     * each generating row's endpoint tangent in the supplied plane, while
     * `normal` supplies its perpendicular. Final joined-skin normals and
     * curvature require separate evaluation. Points of a curve edge take the
     * curve's `normal` as `N` under `across` and the curve's `direction` under
     * every other rule.
     */
    tangent: "normal" | "inward" | "forward" | "backward" | "across";
  }

  /**
   * A closed loop of edges reported by name, such as the opening a neighbour
   * joins.
   */
  export interface IRing {
    /** Name unique among the rings. */
    name: string;

    /** Edges in order, closed, whose points belong to patches. */
    edges: IAutoMovieSurfaceNetwork.IEdge[];

    /**
     * Control positions the loop's vertices take, in loop order, metres; they
     * are kept as given and not fitted. Omitted, the vertices are fitted like
     * any other.
     */
    positions?: IAutoMovieVector3[];

    /**
     * Target limit perimeter at rest, metres, such as a measured girth;
     * omitted, none. The loop must run once round one sweep at one `u`, through
     * vertices of valence four whose loop neighbours lie opposite, beside rows
     * of such vertices, so the limit along it is a uniform cubic B-spline; it
     * cannot also have `positions`. The sweep's points are scaled radially by a
     * factor along `u`, the sampled-overshoot-policy spline through 1 at the
     * sweep's other rings at one `u` and, at each such loop, the factor solved
     * so the fitted cage's limit perimeter there matches, holding its end
     * values beyond the outermost knots; the factor is solved at rest for each
     * tier and retained, without re-solving the perimeter in every pose.
     */
    perimeter?: number;
  }

  /**
   * A patch's texture rectangle, with each axis naming its texture values at
   * local coordinates zero and one. The endpoints may run in either direction.
   */
  export interface IUvRect {
    /** Texture `u` mapped at local coordinate `s` 0 and 1. */
    s: IAutoMovieSurfaceNetwork.IUvAxisMapping;

    /** Texture `v` mapped at local coordinate `t` 0 and 1. */
    t: IAutoMovieSurfaceNetwork.IUvAxisMapping;
  }

  /** Directed texture values at local axis coordinates zero and one. */
  export interface IUvAxisMapping {
    /** Texture value at local coordinate zero. */
    atZero: number;

    /** Texture value at local coordinate one. */
    atOne: number;
  }
}
