/**
 * Data and callback contracts shared by the SolidCycle operations.
 *
 * @evidence contracts/development/design.md#principled-representation Boundary cycles coindex mesh IDs, unwrapped native-chart points and neighboring segments; feet use chart distance rather than world distance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidCycle and body atlas publication share cycle, neighbor and foot records, including the -1 open-boundary sentinel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Array correspondence and valid body indices require producer admission; an optional exact along curve applies only to vertices lying on that curve.
 * @evidence contracts/development/common.md#meaningful-documentation Defines traversal, periodic branches, open neighbors and exact-curve eligibility.
 */
export namespace IAutoMovieSolidCycle {
  /**
   * One mutable face boundary, with coindexed chart/mesh vertices and one
   * neighbour mapping per closing polygon segment.
   *
   * @evidence contracts/development/design.md#principled-representation Parallel vertex/chart/segment arrays represent a face's boundary and its shared neighbour correspondence without deriving geometry from a rendered mesh.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields separate kept-side kind, shared mesh identity, this chart and the adjacent chart's endpoint maps; the optional fifth carries the exact curve a winding cycle samples, absent where its chords are its boundary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not validate array lengths, winding, simplicity or inclusive boundary classification; prepared readers require unchanged kind/chart data during their lifetime.
   * @evidence contracts/development/common.md#meaningful-documentation States coindexing, closing-segment ownership, chart phase unwrapping and which face keeps each side.
   */
  export interface ICycle {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Mesh vertex indices, in cycle order. */
    vertices: number[];

    /** Each vertex's chart point `[u, v]` on this face, `v` unwrapped along the cycle. */
    chart: [number, number][];

    /** Per segment `k` (vertex `k` to `k + 1`, the last closing the cycle): the neighbour face across it. */
    neighbours: IAutoMovieSolidCycle.INeighbour[];

    /**
     * For a winding cycle sampled from an exact curve `u = along(v)` of this chart: the curve's station at a phase. A segment whose two
     * stored vertices both lie on it (`along(v) === u` at each, as the builder evaluated them) is read along the curve between them, not
     * as the chord through them; a vertex inserted later off the curve leaves its segments read as chords. Absent, every segment is a chord.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States which chart the curve is in, which segments read it, and what an inserted off-curve vertex or an absent curve leaves as chords.
     */
    along?: (v: number) => number;

    /**
     * The exact boundary this cycle samples, when one generating owner supplies it to both faces (a port's curve on the host and the
     * band's start edge, the band's end edge and the part's rail): the face's kept side of that curve, and the neighbour's chart point
     * for a point past it, both read on the curve between the stored vertices as well as at them. It describes the cycle as it was
     * built; once a clip has edited the cycle, `segments` says which segments still lie on it. No tolerance and no fallback face is
     * added by it.
     */
    exact?: IExact;

    /**
     * Per segment of a cycle a clip has edited (`divide`, and the clip's rebuilt cycles): the exact boundary the segment still lies
     * on, or null for a chord. A segment between two consecutive vertices of an owner's boundary keeps that owner's readers; a segment
     * a clip made, by placing a crossing into a segment or by laying its own run, is the chord between its vertices. Absent, the
     * cycle is as built and `exact` covers every segment.
     */
    segments?: (IExactSegment | null)[];
  }

  /**
   * The face across one segment and the same directed endpoints in its chart.
   * A body face index of -1 marks an open boundary; Body.atlas translates
   * included body indices to its own face indices before returning across.
   *
   * @evidence contracts/development/design.md#principled-representation An adjacent face identity and two corresponding chart endpoints let Body.atlas linearly map a boundary foot's segment share into that face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One fixed record keeps neighbour identity and directed endpoint correspondence together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A negative or excluded neighbour is not replaced by another face; the record alone does not prove that both surfaces meet along the segment.
   * @evidence contracts/development/common.md#meaningful-documentation Gives body-index ownership, the open sentinel and endpoint order before atlas-index translation.
   */
  export interface INeighbour {
    /** Neighbour index in the owning body, or -1 for an open boundary. */
    face: number;

    /** The segment's first vertex in the neighbour's chart. */
    from: [number, number];

    /** The segment's second vertex in the neighbour's chart. */
    to: [number, number];
  }

  /**
   * A nearest polygon-segment foot in Euclidean chart coordinates, not in
   * the surface metric or world millimetres when the parameters differ.
   *
   * @evidence contracts/development/design.md#principled-representation A segment index and clamped affine share identify the chart foot consumed by Clip and Body.atlas's neighbour map.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three scalars distinguish where the foot lies from the chart distance used to rank it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record certifies no analytic-curve or world-distance minimum; foot on an empty chart returns segment/share zero with infinite distance, not an admitted correspondence.
   * @evidence contracts/development/common.md#meaningful-documentation States polygon meaning, share range, distance space and the empty-chart sentinel limitation.
   */
  export interface IFoot {
    /** The segment, `k` to `k + 1`. */
    segment: number;

    /** The share along it, `[0, 1]`. */
    share: number;

    /** The chart distance to it, the point's phase moved by whole periods to the segment's. */
    distance: number;
  }

  /**
   * The exact boundary one segment of an edited cycle lies on (`ICycle.segments`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the readers' owner and what the sense orients.
   * @evidence contracts/development/design.md#principled-representation An edited cycle is a chain of pieces of its owners' curves and of clips' chords, so exactness is a property of a segment: a cut that crosses a seam at one column leaves every other column on the owner's curve, and a cycle joined from two trims has two owners.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The owner's shared readers and one sign; the segment's ends are the cycle's own chart points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores no copy of the curve, no vertex-count proxy and no tolerance; the sign is fixed by the cycle the owner built and reversed only with the segment's direction.
   */
  export interface IExactSegment {
    /** The owner's readers, shared with every other segment of that boundary. */
    exact: IExact;

    /**
     * Which side of the directed chord the owner's boundary removes: a chart point `p` beside the segment from `a` to `b` lies on the
     * removed side of the chord when `sense * cross(b - a, p - a)` is positive.
     */
    sense: number;
  }

  /**
   * One shared boundary's exact readers on a face's chart (`ICycle.exact`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the count's role, the kept reading and the correspondence.
   * @evidence contracts/development/design.md#principled-representation The atlas's kept test and crossing map read the generating owner's curve directly, so the two faces of one seam own complementary sides of one curve and map a point across it to the same physical point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A count, an optional kept reader for a boundary whose chords are not already exact, and the crossing map.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The readers are the owner's; nothing is fitted or clamped here.
   */
  export interface IExact {
    /** The vertex count the cycle was built with: the readers cover a cycle of that count with no `segments`, every segment of it. */
    count: number;

    /**
     * Whether a chart point lies on the face's kept side of the curve, or on it; absent where the cycle's own chart is already the
     * exact curve (a band's station line).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the reading and the absent case.
     */
    kept?: (u: number, v: number) => boolean;

    /**
     * The neighbour's chart point corresponding to a chart point past the curve: the point's foot on the curve by the owner's
     * correspondence, read in the neighbour's chart.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the foot and the chart it returns.
     */
    across: (u: number, v: number) => [number, number];
  }
}
