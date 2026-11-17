/** Data and callback contracts shared by the SolidCycle operations. */
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
     * @evidence contracts/development/implementation.md#principled-implementation The kept edge is the exact curve the neighbouring band ends on (a port's curved rail), so the two faces share one edge instead of a chord standing off it by its sagitta.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional reader on the cycle; kept tests read it only on segments whose both stored vertices lie on it, and every other reader keeps the chords.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no tolerance or widened boundary: a segment off the curve is read exactly as before.
     * @evidence contracts/development/implementation.md#efficient-algorithms One evaluation per kept test on a qualifying segment, in place of the chord's interpolation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The builder passes the same rail function that placed the cycle's vertices and the band's column ends.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The cycle holds the builder's function for its own lifetime; copies share it and retain nothing else.
     */
    along?: (v: number) => number;
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
}
