import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * One closed or open skin surface as the solid operators read it: a smooth map
 * from its chart `(u, v)` to world millimetres with exact first and second
 * partial derivatives.
 *
 * The merge and the diff (`AutoMovieSolidMerge`, `AutoMovieSolidDiff`) work on
 * two such surfaces, find where they meet and blend them, so they need nothing
 * else of a part: a lofted chain is one with `u` its station and `v` its phase
 * (`AutoMovieSolidChain`), and a closed form is one in a test. The derivatives
 * must be the map's own, analytic or of a smooth fit, because the
 * intersection's tangent and curvature and the blend's G2 edges are built from
 * them; a difference across a step of the map would throw both.
 */
export interface IAutoMovieSolidSurface {
  /** Name in diagnostics, such as `arm.left` or `trunk`. */
  name: string;

  /**
   * The point and partial derivatives at a chart point.
   *
   * @param u First chart parameter, such as a chain's station in mm.
   * @param v Second chart parameter, such as a chain's phase in radians.
   * @returns The surface's 2-jet there.
   */
  jet(u: number, v: number): IAutoMovieSolidSurface.IJet;

  /**
   * Actual Point0 where regular physical2 may be unavailable, such as a
   * retained collapsed tip.
   */
  point?(u: number, v: number): AutoMovieVector3Tuple;

  /**
   * Period of `v`, such as `2 pi` for a chain's phase. Absent, `v` is not
   * periodic and a traced curve may not wrap in it.
   */
  period?: number;

  /**
   * Sign that turns `S_u x S_v` into the outward normal, away from the solid's
   * inside: 1 when `S_u x S_v` already points out, -1 when it points in. The
   * operators read which side of one surface the other keeps from it.
   */
  orientation: 1 | -1;

  /**
   * Inclusive range of `u` actually owned by this map, including only retained
   * original cap intervals when its producer provides them. Solvers reject
   * outside trials before evaluating the map. Domain membership alone does not
   * supply regular physical2 at a collapsed tip. Absent, every finite `u` is
   * owned.
   */
  domain?: [number, number];
}

/** Data and callback contracts shared by the SolidSurface operations. */
export namespace IAutoMovieSolidSurface {
  /**
   * A surface's point and partial derivatives at one chart point. The point is
   * in world mm; each derivative divides by its named parameter units.
   */
  export interface IJet {
    /** Point. */
    p: AutoMovieVector3Tuple;

    /** First derivative in `u`. */
    u: AutoMovieVector3Tuple;

    /** First derivative in `v`. */
    v: AutoMovieVector3Tuple;

    /** Second derivative in `u`. */
    uu: AutoMovieVector3Tuple;

    /** Mixed derivative. */
    uv: AutoMovieVector3Tuple;

    /** Second derivative in `v`. */
    vv: AutoMovieVector3Tuple;
  }
}
