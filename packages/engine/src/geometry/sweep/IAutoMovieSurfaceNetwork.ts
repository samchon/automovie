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
 * and `t` up. Four rules fill a patch:
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
 * - `transition`: a band of a sweep's domain whose column count changes
 *   from its start ring to its end ring by 2-to-1 quad reduction strips, the
 *   way a tube gains or sheds columns along its length; extraordinary
 *   vertices can still perturb its limit curvature.
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
   * @evidence contracts/common.md#principled-implementation One segment count per tier, the declaration that fixes each tier's topology.
   * @evidence contracts/common.md#clear-and-simple-design A record keyed by tier names, so a missing tier is a type error.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts are checked as positive integers by the sampler, not rounded.
   * @evidence contracts/common.md#meaningful-documentation States what is counted.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export type ICounts = Record<AutoMovieSurfaceTier, number>;

  /**
   * A node: a free point, or a point of a sweep's domain so curves meet the sweep exactly.
   *
   * @evidence contracts/common.md#principled-implementation A curve end is either a free point or a point of a sweep's domain, the two ways a curve network meets its surfaces.
   * @evidence contracts/common.md#clear-and-simple-design A closed union of the two kinds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No third kind is guessed from shape.
   * @evidence contracts/common.md#meaningful-documentation States both kinds.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export type INode = IFreeNode | ISweepNode;

  /**
   * A node at a position.
   *
   * @evidence contracts/common.md#principled-implementation A free point in space for curves that do not start on a sweep.
   * @evidence contracts/common.md#clear-and-simple-design A discriminator and a position.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The position is used as given.
   * @evidence contracts/common.md#meaningful-documentation States the unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation A point named by sweep and domain coordinates, so curves meet the sweep exactly and leave it in its tangent plane.
   * @evidence contracts/common.md#clear-and-simple-design Sweep name and `(u, v)`; the position is evaluated, never stored.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts `v` is read modulo one turn rather than refused.
   * @evidence contracts/common.md#meaningful-documentation States the ranges and the modulo reading.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * A curve from one node to another through optional points: the centripetal Catmull-Rom spline through them all, sampled by chord-length share. At a node on a sweep the curve leaves or arrives in the sweep's tangent plane: its end direction is the spline's own less the part along the sweep's normal, so its generating endpoint tangent lies in that plane. Cell averaging and subdivision remain separate; this is not a final-skin normal guarantee.
   *
   * @evidence contracts/common.md#principled-implementation A centripetal Catmull-Rom curve through its nodes and points, with the tangent-plane end condition at sweep nodes and the bridge directions it carries.
   * @evidence contracts/common.md#clear-and-simple-design Nodes by name, optional through points, counts, and the two optional bridge fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A curve whose ends coincide or whose spline meets a sweep along its normal is refused.
   * @evidence contracts/common.md#meaningful-documentation States the spline, the end rule, the counts and when each bridge field is needed.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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

    /** Normal of the surface the bridges make along the curve, needed only when the curve is part of a bridge loop with the `across` rule: a bridge then leaves the curve along this normal crossed with the loop's direction, so opposite loop directions supply opposite cross-boundary input tangents. This constrains the generating rows rather than certifying the final subdivision normals. The normal holds at the curve's middle; toward an end node on a sweep it turns linearly to that sweep's own normal there, which supplies a continuous normal-hint field where the interpolated vector is nonzero. */
    normal?: IAutoMovieVector3;
  }

  /**
   * A patch side or loop piece: a line of a sweep's domain or a network curve.
   *
   * @evidence contracts/common.md#principled-implementation A patch side is a line of a sweep's domain or a network curve, the two boundary kinds a Coons or bridge patch takes.
   * @evidence contracts/common.md#clear-and-simple-design A closed union of the two.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Edges are welded by identity of their points, not by distance.
   * @evidence contracts/common.md#meaningful-documentation States both kinds.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export type IEdge = ISweepEdge | ICurveEdge;

  /**
   * The straight line between two points of a sweep's `(u, v)` domain, sampled evenly in the domain. `v` may run past 1 or below 0 to cross the sweep's seam.
   *
   * @evidence contracts/common.md#principled-implementation A straight segment of a sweep's `(u, v)` domain sampled evenly, which lies on the sweep.
   * @evidence contracts/common.md#clear-and-simple-design Sweep, two domain points and counts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts `v` may cross the seam explicitly rather than being wrapped silently.
   * @evidence contracts/common.md#meaningful-documentation States the even sampling and the seam rule.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation A point of a sweep's parameter domain.
   * @evidence contracts/common.md#clear-and-simple-design Two numbers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are used as given.
   * @evidence contracts/common.md#meaningful-documentation States both parameters.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation A network curve used forward or reversed as a side.
   * @evidence contracts/common.md#clear-and-simple-design Curve name and direction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A reversed edge reuses the curve's points, so both neighbours weld.
   * @evidence contracts/common.md#meaningful-documentation States the direction rule.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation The four fill rules: sweep rectangle, Coons patch, Hermite bridge and quad column-transition band.
   * @evidence contracts/common.md#clear-and-simple-design A closed union.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds are not accepted.
   * @evidence contracts/common.md#meaningful-documentation States the members.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export type IPatch =
    | ISweepPatch
    | ICoonsPatch
    | IBridgePatch
    | ITransitionPatch;

  /**
   * A rectangle of a sweep's domain.
   *
   * @evidence contracts/common.md#principled-implementation A rectangle of a sweep's domain sampled on its tier grid.
   * @evidence contracts/common.md#clear-and-simple-design Domain ranges and per-tier counts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ranges must increase within the domain; they are refused otherwise.
   * @evidence contracts/common.md#meaningful-documentation States which patch coordinate runs along which parameter.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * A band of a sweep's domain whose column count changes across it, so a sweep can carry more columns where it needs detail, such as a groove, and fewer where it meets a coarser ring.
   *
   * The band runs from its start ring at `u[0]` to its end ring at `u[1]` in `rows` even rows, with `start` columns evenly spaced round the first ring and `end` round the last, so it welds onto sweep patches of those counts on either side. Give it rows so its middle row is about as tall as a coarse column is wide: on a cylinder going from 8 to 16 columns, a middle row half that tall bends the limit normal round the poles by 8 degrees instead of 5. Its middle row reduces the finer ring to the coarser by `(fine - coarse) / 2` blocks of the 2-to-1 quad reduction strip, each turning four fine columns into two coarse columns through six quads with two interior poles of valence three half-way across the row; every other column passes straight through, and rows before the middle keep the start count and rows after it the end count. The fine ring stays regular; the coarse ring vertices at the blocks' corners take valence five beside a straight column and six between two blocks. Blocks spread evenly round the band and mirror with it, as `layoutAutoMovieSurfaceTransition` states. Vertices sample the sweep with the rig's cell averaging. With fitting enabled, free limit vertices interpolate those filtered targets; the surface between them still depends on subdivision topology; put the band where the sweep is gently curved along `u`, because its poles carry the most curvature error, and narrow its `v` range to keep them off a region, splitting the ring into several bands.
   *
   * Counts must differ by an even number, the finer at most twice the coarser, so a larger change chains two bands; equal counts give plain rows. The patch's `(s, t)` coordinates run along `v` and `u` as a sweep patch's do, but its faces are not a grid: each face's corners carry their own coordinates.
   *
   * @evidence contracts/common.md#principled-implementation The 2-to-1 quad reduction strip of subdivision modelling laid on a sweep's domain, sampled on the sweep and interpolated by the limit fit like any sweep patch.
   * @evidence contracts/common.md#clear-and-simple-design A sweep patch with two column counts instead of one; the reduction itself is fixed, so no layout is authored.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts the pattern cannot join are refused instead of being stitched by triangles or a crease.
   * @evidence contracts/common.md#meaningful-documentation States the band, the pattern, the poles and where to put them, the counts rule and the coordinates.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export interface ITransitionPatch {
    /** Discriminator. */
    type: "transition";

    /** Name unique among the patches. */
    name: string;

    /** Name of the sweep. */
    sweep: string;

    /** Range of `u`, increasing, within 0 to 1: the start ring and the end ring; `t` runs along it. */
    u: [number, number];

    /** Range of `v`, increasing, at most one turn; `s` runs along it. */
    v: [number, number];

    /** Columns along the start ring by tier. */
    start: ICounts;

    /** Columns along the end ring by tier. */
    end: ICounts;

    /** Rows across the band by tier; the middle one changes the count. */
    rows: ICounts;

    /** The patch's rectangle in texture space; omitted, the sampler assigns one. */
    uv?: IUvRect;
  }

  /**
   * A patch bounded by four edges, filled by the Coons patch of its boundary.
   *
   * @evidence contracts/common.md#principled-implementation Coons' bilinearly blended patch of four boundary edges.
   * @evidence contracts/common.md#clear-and-simple-design Four sides in counterclockwise order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sides that do not close or whose opposite counts differ are refused.
   * @evidence contracts/common.md#meaningful-documentation States the side order and its winding.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation Cubic Hermite rows between two loops of equal count, the explicit blend of a branch or junction.
   * @evidence contracts/common.md#clear-and-simple-design Two loops, rows and a tension.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Loops of different counts are refused instead of resampled.
   * @evidence contracts/common.md#meaningful-documentation States the column formula and the tension.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
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
   * @evidence contracts/common.md#principled-implementation A closed sequence of edges with the rule for the direction a bridge travels there.
   * @evidence contracts/common.md#clear-and-simple-design Edges plus one tangent rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loop that does not close is refused.
   * @evidence contracts/common.md#meaningful-documentation States every tangent rule and what `across` guarantees.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export interface ILoop {
    /** Edges in order, each starting where the previous ends, the last ending where the first starts. Their points must already belong to sweep or Coons patches. */
    edges: IEdge[];

    /**
     * Direction of travel at the loop: `normal` and `inward` along or against a sweep's outward normal, `forward` and `backward` along or against its spine (`+u` or `-u`), and `across` within the sweep's tangent plane perpendicular to the loop, `N x L` for the outward normal `N` and the loop's direction `L` at the point, which points into the region the loop encloses when the loop runs counterclockwise about `N`. `across` places each generating row's endpoint tangent in the supplied plane, while `normal` supplies its perpendicular. Final joined-skin normals and curvature require separate evaluation. Points of a curve edge take the curve's `normal` as `N` under `across` and the curve's `direction` under every other rule.
     */
    tangent: "normal" | "inward" | "forward" | "backward" | "across";
  }

  /**
   * A closed loop of edges reported by name, such as the opening a neighbour joins.
   *
   * @evidence contracts/common.md#principled-implementation A named closed loop of patch vertices, optionally pinned to positions a neighbouring part shares.
   * @evidence contracts/common.md#clear-and-simple-design Edges and optional positions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pinned positions are kept as given and not fitted.
   * @evidence contracts/common.md#meaningful-documentation States what a ring reports and what pinning means.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export interface IRing {
    /** Name unique among the rings. */
    name: string;

    /** Edges in order, closed, whose points belong to patches. */
    edges: IEdge[];

    /** Control positions the loop's vertices take, in loop order, metres; they are kept as given and not fitted. Omitted, the vertices are fitted like any other. */
    positions?: IAutoMovieVector3[];

    /**
     * Target limit perimeter at rest, metres, such as a measured girth; omitted, none. The loop must run once round one sweep at one `u`, through vertices of valence four whose loop neighbours lie opposite, beside rows of such vertices, so the limit along it is a uniform cubic B-spline; it cannot also have `positions`. The sweep's points are scaled radially by a factor along `u`, the sampled-overshoot-policy spline through 1 at the sweep's other rings at one `u` and, at each such loop, the factor solved so the fitted cage's limit perimeter there matches, holding its end values beyond the outermost knots; the factor is solved at rest for each tier and retained, without re-solving the perimeter in every pose.
     */
    perimeter?: number;
  }

  /**
   * A patch's rectangle in texture space; `s` maps linearly onto the first range and `t` onto the second.
   *
   * @evidence contracts/common.md#principled-implementation A linear map of patch coordinates onto a texture rectangle.
   * @evidence contracts/common.md#clear-and-simple-design Two ranges.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No packing is attempted; the author places rectangles.
   * @evidence contracts/common.md#meaningful-documentation States the mapping.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   */
  export interface IUvRect {
    /** Texture `u` at `s` 0 and 1. */
    s: [number, number];

    /** Texture `v` at `t` 0 and 1. */
    t: [number, number];
  }
}
