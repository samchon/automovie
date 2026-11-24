import type { IAutoMovieViewChain } from "../../../construction/IAutoMovieViewChain";
import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanConicSection; runtime evaluation remains in Human.
 */
export namespace IAutoMovieHumanConicSection {
  /** The anchors of a section family.
   */
  export interface ILayout {
    /** Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. */
    anchors: IAnchor[];

    /** Reflect the listed half in the median line `v = 0`. */
    mirror: boolean;

    /**
     * Least shoulder an arc of this family takes. The model's edge bound still
     * applies. A shoulder far below the ellipse's `sqrt(2) - 1` approaches its
     * chord and concentrates turn near its endpoints.
     *
     * A list holds one bound per arc in shoulder order (`leastOf`). This allows
     * a tight turn and a flatter arc to use their own bounds within one section.
     */
    least?: number | readonly number[];
  }

  /** One anchor of a layout.
   */
  export interface IAnchor {
    /** The tangent rule, as the namespace describes. */
    kind: "u" | "v" | "m" | "i" | "f";

    /** A `u` anchor on the median line `v = 0`. */
    mid?: boolean;

    /** One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. */
    guide?: boolean;

    /** Nesting level of an `m` or `i` anchor, 1 when absent: its neighbours are the nearest anchors of a lower level. */
    level?: number;

    /** The feature line an `f` anchor stands on, for its seed and its record; generation does not read it. */
    feature?: "convex" | "concave" | "inflection";

    /** Phase window in radians where an observation of this `u`, `v` or `f` anchor is sought; generation does not read it. */
    window?: [number, number];

    /** Whether an observation takes the window's largest or smallest coordinate; generation does not read it. */
    pick?: "max" | "min";
  }

  /** What a field measures: millimetres, a share in (0, 1), or an angle in radians.
   */
  export type Unit = "mm" | "share" | "angle";

  /** The closed chain of a field vector with the positions of the engine's four guides in it.
   */
  export interface IChain {
    /** The native chain input: points, tangents and shoulders in increasing phase. */
    input: IAutoMovieViewChain.IInput;

    /** Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain. */
    guides: number[];
  }

  /** One run of feature anchors inserted after an anchor of a base layout (`featured`).
   */
  export interface IFeatureRun {
    /** Index in the base layout's anchors after which the run stands. */
    after: number;

    /** The feature anchors (`f`), in increasing phase. */
    anchors: IAnchor[];
  }

  /** Result of AutoMovieHumanConicSection.offsets. Offsets of every anchor's first field, and the offset of the first shoulder.
   */
  export type IOffsetsResult = {
    /** Start index of each anchor's shape values in the packed section vector. */
    at: number[];
    /** Start index of the conic-shoulder values following the anchor fields. */
    shoulders: number;
  };

  /** Result of AutoMovieHumanConicSection.frame. The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the
  layout's order (round the end of the list for a closed layout). Every feature of a run shares this frame and its chord.
 */
  export type FrameResult = [number, number];

  /** Result of AutoMovieHumanConicSection.place. A feature point on the chord from `p0` to `p2`: at `t` of the way along it, the offset `o` square to it, millimetres outward (to the
  right of travel, which is outward on a counter-clockwise section), and its tangent the chord's direction turned by `h` radians.
 */
  export type IPlaceResult = {
    /** Placed feature point in the local section chart, millimetres. */
    point: AutoMovieVector2Tuple;
    /** Feature tangent direction in the local section chart; its turn is relative to the anchor chord. */
    tangent: AutoMovieVector2Tuple;
  };

  /** Result of AutoMovieHumanConicSection.unplace. The numbers `[share, o, h]` of a feature point `p` with the tangent heading `heading` on the chord from `p0` to `p2`, the feature
  before it in the run at `previous` of the way along (`along`, `place`), and how far along the chord `p` itself stands.
 */
  export type IUnplaceResult = {
    /** Recovered feature controls: chord share, perpendicular offset in millimetres, and tangent turn in radians. */
    values: [number, number, number];
    /** Recovered share along the feature's chord, before subsequent features consume the remaining interval. */
    t: number;
  };

  /** Result of AutoMovieHumanConicSection.neighbours. The nearest resolved anchors before and after anchor `k`.
   */
  export type NeighboursResult = [number, number];
}
