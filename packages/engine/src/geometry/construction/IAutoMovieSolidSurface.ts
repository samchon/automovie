import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/**
 * One closed or open skin surface as the solid operators read it: a smooth
 * map from its chart `(u, v)` to world millimetres with exact first and
 * second partial derivatives.
 *
 * The merge and the diff (`AutoMovieSolidMerge`, `AutoMovieSolidDiff`)
 * work on two such surfaces, find where they meet and blend them, so they need
 * nothing else of a part: a lofted chain is one with `u` its station and `v`
 * its phase (`AutoMovieSolidChain`), and a closed form is one in a test.
 * The derivatives must be the map's own, analytic or of a smooth fit, because
 * the intersection's tangent and curvature and the blend's G2 edges are built
 * from them; a difference across a step of the map would throw both.
 *
 * @evidence contracts/common.md#principled-implementation The solid operators need only a smooth chart with exact 2-jets, its period, orientation and domain, so any surface that supplies them can be merged, cut or trimmed.
 * @evidence contracts/common.md#clear-and-simple-design One jet function and three properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The jets must be the map's own; finite differences would break the trace and the G2 blend.
 * @evidence contracts/common.md#meaningful-documentation States the chart, the jet, the orientation rule and the domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface; costs are its implementations'.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No state of its own.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retention is its implementation's.
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
   * Period of `v`, such as `2 pi` for a chain's phase. Absent, `v` is not
   * periodic and a traced curve may not wrap in it.
   */
  period?: number;

  /**
   * Sign that turns `S_u x S_v` into the outward normal, away from the
   * solid's inside: 1 when `S_u x S_v` already points out, -1 when it points
   * in. The operators read which side of one surface the other keeps from it.
   */
  orientation: 1 | -1;

  /**
   * The range of `u` the surface owns, such as a chain's first and last
   * layer stations. A chain's jet past them is its end section held, not
   * the surface, so a curve or rail found there is reported. Absent, every
   * `u` is the surface's own.
   */
  domain?: [number, number];
}
export namespace IAutoMovieSolidSurface {
  /** A surface's point and partial derivatives at one chart point, world mm per unit of each parameter. */
  export interface IJet {
    /** Point. */
    p: AutoMovieSolidVector.Vec3;

    /** First derivative in `u`. */
    u: AutoMovieSolidVector.Vec3;

    /** First derivative in `v`. */
    v: AutoMovieSolidVector.Vec3;

    /** Second derivative in `u`. */
    uu: AutoMovieSolidVector.Vec3;

    /** Mixed derivative. */
    uv: AutoMovieSolidVector.Vec3;

    /** Second derivative in `v`. */
    vv: AutoMovieSolidVector.Vec3;
  }
}
