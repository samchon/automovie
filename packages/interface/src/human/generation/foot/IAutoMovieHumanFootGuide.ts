/**
 * Foot-fan knot coordinates and retained guide splines, including first and second derivatives.
 *
 * The interface package owns these declarations; AutoMovieHumanFootGuide in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Foot-fan knot coordinates and retained guide splines, including first and second derivatives. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IGuide, IFanKnot declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IGuide, IFanKnot separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanFootGuide exchanges the named IGuide, IFanKnot contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanFootGuide {
  /** A guide: its kept knots' stations and places, and their spline's jets.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A guide: its kept knots' stations and places, and their spline's jets.
   * @evidence contracts/development/design.md#principled-representation `stations`: Strictly increasing stations of the kept knots. `values`: Each kept knot's `[across, up]` in its plane, mm. `slopes`: The spline's first derivatives at the knots.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootGuide.of. Read by AutoMovieHumanFootGuide.at, AutoMovieHumanFootGuide.tangent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stations`, `values`, `slopes`, `curvatures`; callers supply the complete record.
   */
  export interface IGuide {
    /** Strictly increasing stations of the kept knots. */
    stations: number[];

    /** Each kept knot's `[across, up]` in its plane, mm. */
    values: number[][];

    /** The spline's first derivatives at the knots. */
    slopes: number[][];

    /** The spline's second derivatives at the knots. */
    curvatures: number[][];
  }

  /**
   * A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's
   * station as a share of the web ring to the ankle ring, and the landmark's
   * place with its height both in foot lengths and in lateral malleolus
   * heights (handed from the first to the second over the turn).
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn).
   * @evidence contracts/development/design.md#principled-representation A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn). The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootGuide.fanned. Also types AutoMovieHumanFootColumn.KNOTS, AutoMovieHumanFootKnots.FANNED.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootColumn.KNOTS, AutoMovieHumanFootColumn.knots, AutoMovieHumanFootColumn.law, AutoMovieHumanFootGuide.fanned for a knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's station as a share of the web ring to the ankle ring, and the landmark's place with its height both in foot lengths and in lateral malleolus heights (handed from the first to the second over the turn).
   */
  export type IFanKnot = readonly [number, number, number, number, number];
}
