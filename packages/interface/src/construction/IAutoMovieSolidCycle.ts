/** Data and callback contracts shared by the SolidCycle operations. */
export namespace IAutoMovieSolidCycle {
  /**
   * One mutable face boundary, with coindexed chart/mesh vertices and one
   * neighbour mapping per closing polygon segment.
   */
  export interface ICycle {
    /** Which side the face keeps. */
    kind: "hole" | "island" | "start" | "end";

    /** Mesh vertex indices, in cycle order. */
    vertices: number[];

    /**
     * Each vertex's chart point `[u, v]` on this face, `v` unwrapped along the
     * cycle.
     */
    chart: [number, number][];

    /**
     * Per segment `k` (vertex `k` to `k + 1`, the last closing the cycle): the
     * neighbour face across it.
     */
    neighbours: IAutoMovieSolidCycle.INeighbour[];

    /**
     * For a winding cycle sampled from an exact curve `u = along(v)` of this
     * chart: the curve's station at a phase. A segment whose two stored
     * vertices both lie on it (`along(v) === u` at each, as the builder
     * evaluated them) is read along the curve between them, not as the chord
     * through them; a vertex inserted later off the curve leaves its segments
     * read as chords. Absent, every segment is a chord.
     */
    along?: (v: number) => number;

    /**
     * The exact boundary this cycle samples, when one generating owner supplies
     * it to both faces (a port's curve on the host and the band's start edge,
     * the band's end edge and the part's rail): the face's kept side of that
     * curve, and the neighbour's chart point for a point past it, both read on
     * the curve between the stored vertices as well as at them. It describes
     * the cycle as it was built; once a clip has edited the cycle, `segments`
     * says which segments still lie on it. No tolerance and no fallback face is
     * added by it.
     */
    exact?: IExact;

    /**
     * Per segment of a cycle a clip has edited (`divide`, and the clip's
     * rebuilt cycles): the exact boundary the segment still lies on, or null
     * for a chord. A segment between two consecutive vertices of an owner's
     * boundary keeps that owner's readers; a segment a clip made, by placing a
     * crossing into a segment or by laying its own run, is the chord between
     * its vertices. Absent, the cycle is as built and `exact` covers every
     * segment.
     */
    segments?: (IExactSegment | null)[];
  }

  /**
   * The face across one segment and the same directed endpoints in its chart. A
   * body face index of -1 marks an open boundary; Body.atlas translates
   * included body indices to its own face indices before returning across.
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
   * A nearest polygon-segment foot in Euclidean chart coordinates, not in the
   * surface metric or world millimetres when the parameters differ.
   */
  export interface IFoot {
    /** The segment, `k` to `k + 1`. */
    segment: number;

    /** The share along it, `[0, 1]`. */
    share: number;

    /**
     * The chart distance to it, the point's phase moved by whole periods to the
     * segment's.
     */
    distance: number;
  }

  /**
   * The exact boundary one segment of an edited cycle lies on
   * (`ICycle.segments`).
   */
  export interface IExactSegment {
    /** The owner's readers, shared with every other segment of that boundary. */
    exact: IExact;

    /**
     * Which side of the directed chord the owner's boundary removes: a chart
     * point `p` beside the segment from `a` to `b` lies on the removed side of
     * the chord when `sense * cross(b - a, p - a)` is positive.
     */
    sense: number;
  }

  /** One shared boundary's exact readers on a face's chart (`ICycle.exact`). */
  export interface IExact {
    /**
     * The vertex count the cycle was built with: the readers cover a cycle of
     * that count with no `segments`, every segment of it.
     */
    count: number;

    /**
     * Whether a chart point lies on the face's kept side of the curve, or on
     * it; absent where the cycle's own chart is already the exact curve (a
     * band's station line).
     */
    kept?: (u: number, v: number) => boolean;

    /**
     * The neighbour's chart point corresponding to a chart point past the
     * curve: the point's foot on the curve by the owner's correspondence, read
     * in the neighbour's chart.
     */
    across: (u: number, v: number) => [number, number];
  }
}
