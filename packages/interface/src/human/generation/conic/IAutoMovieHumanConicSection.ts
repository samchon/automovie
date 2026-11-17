import type { IAutoMovieViewChain } from "../../../construction/IAutoMovieViewChain";
import type { AutoMovieVector2Tuple } from "../../../geometry/AutoMovieVector2Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanConicSection; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanConicSection exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ILayout, IAnchor, Unit, IChain, IFeatureRun, IOffsetsResult, FrameResult, IPlaceResult, IUnplaceResult, NeighboursResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanConicSection; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ILayout, IAnchor, Unit, IChain, IFeatureRun, IOffsetsResult, FrameResult, IPlaceResult, IUnplaceResult, NeighboursResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanConicSection {
  /** The anchors of a section family.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The anchors of a section family.
   * @evidence contracts/development/design.md#principled-representation `anchors`: Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. `mirror`: Reflect the listed half in the median line `v = 0`. `least`: Least shoulder an arc of this family takes; absent, only the model's edge bound holds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanConicSection.limb, AutoMovieHumanConicSection.lens, AutoMovieHumanConicSection.bilateral. Read by AutoMovieHumanConicSection.featured, AutoMovieHumanConicSection.convert, AutoMovieHumanConicSection.units. Also types AutoMovieHumanConicLoft.twinLayout, AutoMovieHumanConicSection.layout.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `least`: Least shoulder an arc of this family takes; absent, only the model's edge bound holds.
   */
  export interface ILayout {
    /** Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. */
    anchors: IAnchor[];

    /** Reflect the listed half in the median line `v = 0`. */
    mirror: boolean;

    /**
     * Least shoulder an arc of this family takes; absent, only the model's edge bound holds. An arc whose shoulder lies far under the
     * ellipse's `sqrt(2) - 1` hugs its chord and turns at its ends, and where two such arcs meet at an extreme the wall turns within a few
     * millimetres: f1's trunk held 0.22 to 0.36 either side of its side extreme over the hips, turned 1.06 degrees a half millimetre there
     * against 0.2 elsewhere, and drew an upright line down each hip. It is a family's own number, not the model's, because other walls
     * (the face's, the leg's) were fitted with lower shoulders where their skin wants them.
     *
     * A list holds one least per arc, in the order of the shoulders (`leastOf`). The bound belongs to the arcs that need it, not to the
     * whole section: f1's foot end was fitted under 0.3 for the two arcs at its top, whose corner drew a slot at the big toe's root, and
     * the same bound held the sole's arc at 0.3 from 896 to 960 mm, where the skin wants a flatter arc, so the wall stood 1.0 to 1.7 mm
     * under the sole and each section fitted alone without it came within 0.4 to 0.85 mm.
     */
    least?: number | readonly number[];
  }

  /** One anchor of a layout.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One anchor of a layout.
   * @evidence contracts/development/design.md#principled-representation `kind`: The tangent rule, as the namespace describes. `mid`: A `u` anchor on the median line `v = 0`. `guide`: One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanConicLoft.anchors, AutoMovieHumanConicLoft.anchor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `mid`: A `u` anchor on the median line `v = 0`. `guide`: One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. `level`: Nesting level of an `m` or `i` anchor, 1 when absent: its neighbours are the nearest anchors of a lower level. `feature`: The feature line an `f` anchor stands on, for its seed and its record; generation does not read it. `window`: Phase window in radians where an observation of this `u`, `v` or `f` anchor is sought; generation does not read it. `pick`: Whether an observation takes the window's largest or smallest coordinate; generation does not read it.
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
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a field measures: millimetres, a share in (0, 1), or an angle in radians.
   * @evidence contracts/development/design.md#principled-representation What a field measures: millimetres, a share in (0, 1), or an angle in radians. The closed alternatives are "mm", "share", "angle".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanConicSection.units. Also types AutoMovieHumanConicSection.out.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicSection.units, AutoMovieHumanConicSection.out for what a field measures: millimetres, a share in (0, 1), or an angle in radians.
   */
  export type Unit = "mm" | "share" | "angle";

  /** The closed chain of a field vector with the positions of the engine's four guides in it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The closed chain of a field vector with the positions of the engine's four guides in it.
   * @evidence contracts/development/design.md#principled-representation `input`: The native chain input: points, tangents and shoulders in increasing phase. `guides`: Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanConicSection.resolve. Also types AutoMovieHumanConicLoft.resolved, AutoMovieHumanConicLoft.chain.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `input`, `guides`; callers supply the complete record.
   */
  export interface IChain {
    /** The native chain input: points, tangents and shoulders in increasing phase. */
    input: IAutoMovieViewChain.IInput;

    /** Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain. */
    guides: number[];
  }

  /** One run of feature anchors inserted after an anchor of a base layout (`featured`).
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One run of feature anchors inserted after an anchor of a base layout (`featured`).
   * @evidence contracts/development/design.md#principled-representation `after`: Index in the base layout's anchors after which the run stands. `anchors`: The feature anchors (`f`), in increasing phase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanConicSection.featured, AutoMovieHumanConicSection.convert.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `after`, `anchors`; callers supply the complete record.
   */
  export interface IFeatureRun {
    /** Index in the base layout's anchors after which the run stands. */
    after: number;

    /** The feature anchors (`f`), in increasing phase. */
    anchors: IAnchor[];
  }

  /** Result of AutoMovieHumanConicSection.offsets. Offsets of every anchor's first field, and the offset of the first shoulder.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Offsets of every anchor's first field, and the offset of the first shoulder.
   * @evidence contracts/development/design.md#principled-representation `at`: Start index of each anchor's shape values in the packed section vector. `shoulders`: Start index of the conic-shoulder values following the anchor fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicSection.IOffsetsResult is the canonical exchange used by AutoMovieHumanConicSection.offsets.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `shoulders`; callers supply the complete record.
   */
  export type IOffsetsResult = {
    /** Start index of each anchor's shape values in the packed section vector. */
    at: number[];
    /** Start index of the conic-shoulder values following the anchor fields. */
    shoulders: number;
  };

  /** Result of AutoMovieHumanConicSection.frame. The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the
  layout's order (round the end of the list for a closed layout). Every feature of a run shares this frame and its chord.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout).
 * @evidence contracts/development/design.md#principled-representation The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout). Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicSection.FrameResult is the canonical exchange used by AutoMovieHumanConicSection.frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicSection.frame for the two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout).
 */
  export type FrameResult = [number, number];

  /** Result of AutoMovieHumanConicSection.place. A feature point on the chord from `p0` to `p2`: at `t` of the way along it, the offset `o` square to it, millimetres outward (to the
  right of travel, which is outward on a counter-clockwise section), and its tangent the chord's direction turned by `h` radians.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A feature point on the chord from `p0` to `p2`: at `t` of the way along it, the offset `o` square to it, millimetres outward (to the right of travel, which is outward on a counter-clockwise section), and its tangent the chord's direction turned by `h` radians.
 * @evidence contracts/development/design.md#principled-representation `point`: Placed feature point in the local section chart, millimetres. `tangent`: Feature tangent direction in the local section chart; its turn is relative to the anchor chord.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicSection.IPlaceResult is the canonical exchange used by AutoMovieHumanConicSection.place.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `tangent`; callers supply the complete record.
 */
  export type IPlaceResult = {
    /** Placed feature point in the local section chart, millimetres. */
    point: AutoMovieVector2Tuple;
    /** Feature tangent direction in the local section chart; its turn is relative to the anchor chord. */
    tangent: AutoMovieVector2Tuple;
  };

  /** Result of AutoMovieHumanConicSection.unplace. The numbers `[share, o, h]` of a feature point `p` with the tangent heading `heading` on the chord from `p0` to `p2`, the feature
  before it in the run at `previous` of the way along (`along`, `place`), and how far along the chord `p` itself stands.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The numbers `[share, o, h]` of a feature point `p` with the tangent heading `heading` on the chord from `p0` to `p2`, the feature before it in the run at `previous` of the way along (`along`, `place`), and how far along the chord `p` itself stands.
 * @evidence contracts/development/design.md#principled-representation `values`: Recovered feature controls: chord share, perpendicular offset in millimetres, and tangent turn in radians. `t`: Recovered share along the feature's chord, before subsequent features consume the remaining interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicSection.IUnplaceResult is the canonical exchange used by AutoMovieHumanConicSection.unplace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `values`, `t`; callers supply the complete record.
 */
  export type IUnplaceResult = {
    /** Recovered feature controls: chord share, perpendicular offset in millimetres, and tangent turn in radians. */
    values: [number, number, number];
    /** Recovered share along the feature's chord, before subsequent features consume the remaining interval. */
    t: number;
  };

  /** Result of AutoMovieHumanConicSection.neighbours. The nearest resolved anchors before and after anchor `k`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The nearest resolved anchors before and after anchor `k`.
   * @evidence contracts/development/design.md#principled-representation The nearest resolved anchors before and after anchor `k`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanConicSection.NeighboursResult is the canonical exchange used by AutoMovieHumanConicSection.neighbours.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanConicSection.neighbours for the nearest resolved anchors before and after anchor `k`.
   */
  export type NeighboursResult = [number, number];
}
