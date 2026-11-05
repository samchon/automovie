import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { combine } = AutoMovieSolidVector;

/**
 * A surface's 2-jet across a rail: what a blend copies at its edge (rule J4 of
 * `docs/techniques/surface-composition.md` with `beta = 0`).
 *
 * A rail is a chart point `r` of the surface; the cross direction is a chart
 * direction `d` with a scale `a`. The ribbon is the jet at `w = 0` of the
 * surface curve `w -> S(r + w a d)`:
 *
 * ```text
 * point  = S(r)
 * first  = a (S_u d_u + S_v d_v)
 * second = a^2 (S_uu d_u^2 + 2 S_uv d_u d_v + S_vv d_v^2)
 * ```
 *
 * When `r`, `d` and `a` are smooth functions of the rail's parameter `phi`,
 * a blend that copies these three vectors at its edge shares the whole
 * parametric 2-jet of `g(phi, w) = S(r(phi) + w a(phi) d(phi))` there: its
 * derivatives along the edge are those of `S(r(phi))`, and its mixed
 * derivative is the `phi` derivative of the copied `first`, which is `g`'s
 * mixed derivative too. So the blend meets the surface G2 along the rail by
 * construction, for any direction field transversal to the rail.
 *
 * @evidence contracts/common.md#principled-implementation A ribbon is a surface's 2-jet along a rail in the across direction, the data a G2 blend matches.
 * @evidence contracts/common.md#clear-and-simple-design One ribbon record of point, first and second across derivatives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The derivatives are the surface's own jets along the square direction.
 * @evidence contracts/common.md#meaningful-documentation States the three fields and their scale.
 * @evidence contracts/performance.md#efficient-algorithms One surface jet per ribbon.
 * @evidence contracts/performance.md#reuse-equivalent-work The rail's jet is reused for the ribbon.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three vectors per ribbon.
 */
export namespace AutoMovieSolidRibbon {
  /** A surface's jet across a rail at one point. */
  export interface IRibbon {
    /** The rail's point, mm. */
    point: Vec3;

    /** First derivative across the rail per unit of the blend's cross parameter. */
    first: Vec3;

    /** Second derivative across the rail. */
    second: Vec3;
  }

  /**
   * The ribbon at one rail point.
   *
   * @param surface The surface.
   * @param u The rail's first chart parameter.
   * @param v The rail's second chart parameter.
   * @param du The cross direction's first chart component.
   * @param dv The cross direction's second chart component.
   * @param a The scale of the cross parameter: chart units of `d` per unit `w`.
   * @returns The ribbon.
   */
  export function of(surface: IAutoMovieSolidSurface, u: number, v: number, du: number, dv: number, a: number): IRibbon {
    const j: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
    return {
      point: j.p,
      first: combine([
        [a * du, j.u],
        [a * dv, j.v],
      ]),
      second: combine([
        [a * a * du * du, j.uu],
        [2 * a * a * du * dv, j.uv],
        [a * a * dv * dv, j.vv],
      ]),
    };
  }
}
