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
 * @evidence contracts/development/common.md#meaningful-documentation States the three fields and their scale.
 * @evidence contracts/development/design.md#principled-representation Represents A surface's 2-jet across a rail: what a blend copies at its edge (rule J4 of `docs/techniques/surface-composition.md` with `beta = 0`): companion namespace of 2 members (`IRibbon`, `of`); units and frames named in its text: second, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidRibbon` in packages/engine/src/geometry/construction/AutoMovieSolidRibbon.ts; its surface is the 2 members listed and the text shows 7 other files naming it, mostly packages/engine (6), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidRibbon {
  /**
   * Surface point and two across derivatives for a fixed chart direction/scale.
   *
   * @evidence contracts/development/design.md#principled-representation These three vectors are the endpoint data of the surface restriction S(r+w*a*d) used by a boundary-matching blend.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Point, first and second derivative fields expose the transverse jet without storing another surface evaluator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not certify transversality, smooth variation along the rail or G2 continuity of a whole blended surface.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm point units and derivative orders relative to the blend cross parameter.
   */
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies the directional first/second chain rule to S(r+w*a*d) with chart direction and scale held fixed at this rail reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One surface jet and two weighted vector sums produce exactly the three boundary fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses analytic surface partials without finite differences or a fabricated normal; regular jets and a transverse direction for a regular blend remain caller premises.
   * @evidence contracts/development/common.md#meaningful-documentation Gives chart parameters/direction, cross scale and the complete derivative formulas above.
   * @evidence contracts/development/implementation.md#efficient-algorithms One surface-jet callback and fixed-size vector arithmetic take constant additional work and storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same newly fetched jet supplies point, first and second fields; this function does not reuse a previously fetched caller jet or coordinate requests.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the jet's point reference and two fresh derivative triples; temporary weighted-term arrays are call-local and no cache is owned.
   */
  export function of(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
    du: number,
    dv: number,
    a: number,
  ): IRibbon {
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
