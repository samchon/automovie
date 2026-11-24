import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A face's skin cut by a surface fixed in space: the curve `u = rho(v)` on the face's chart along which the skin enters the region a set
 * of planes keeps, read with the two derivatives a band's edge needs (`IAutoMovieConstructionSplit.ICut`).
 *
 * The region is `G(x) >= 0`, `G` the minimum of the planes' signed distances `g_i(x) = n_i . (x - q_i)`, or with a rounding length
 * `r` their smooth minimum `-r ln(sum_i exp(-g_i / r))`, which lies below the minimum by at most `r ln(planes)` and has the gradient
 * `sum_i w_i n_i`, `w_i = exp(-g_i / r) / sum`, and the Hessian `-(sum_i w_i n_i n_i^T - grad grad^T) / r`. On the skin `S(u, v)` the
 * residual is `F(u, v) = G(S(u, v))`; the rail's station at a phase is the first root of `F` in `u` from the end that faces the band,
 * and by the implicit function theorem `rho' = -F_v / F_u` and `rho'' = -(F_vv + 2 F_uv rho' + F_uu rho'^2) / F_u`, every term the chain
 * rule on the skin's own 2-jet, so no derivative is differenced.
 */
export namespace IAutoMovieConstructionSkinCut {
  /**
   * A plane in kernel coordinates with its kept side.
   */
  export interface IPlane {
    /** A point of the plane, mm. */
    point: AutoMovieVector3Tuple;

    /** The unit normal toward the kept side. */
    normal: AutoMovieVector3Tuple;
  }

  /**
   * What a cut is built from.
   */
  export interface IInput {
    /** The face's skin, chart `(station mm, phase rad)`. */
    surface: IAutoMovieSolidSurface;

    /** The planes, at least one. */
    planes: readonly IPlane[];

    /** The rounding length of the planes' edges, mm, positive; absent, the plain minimum. */
    round?: number;

    /** The station's sign from the end that faces the band into the face's kept side. */
    into: 1 | -1;

    /** The face's own stations inside its domain, increasing, mm: where the residual's first sign change is bracketed. */
    stations: readonly number[];

    /** Phases round the face at which the curve is bracketed and admitted when it is built, at least 8. */
    samples: number;
  }

  /**
   * A built cut.
   */
  export interface ICut {
    /**
     * The rail's station at a phase with its first and second phase derivatives, mm and mm per radian. The same phase always returns the
     * same numbers. It throws `AutoMovieLoftAdmissionError` at a phase between the admitted ones where the skin does not cross the
     * surface or is tangent to it.
     */
    at: (psi: number) => [number, number, number];

    /** Point at that same admitted root in world millimetres, without calculating the curve derivatives. */
    point?: (psi: number) => AutoMovieVector3Tuple;

    /** The least and greatest station of the curve at its admitted phases, mm. */
    reach: [number, number];
  }
}
