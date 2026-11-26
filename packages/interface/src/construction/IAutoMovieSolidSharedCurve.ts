import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidRail } from "./IAutoMovieSolidRail";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A join's contact as a declared closed loop on the host that both surfaces
 * share, in place of a traced intersection: the curve of a mixed join, along
 * which the part runs on from the host where the two are tangent and crosses it
 * elsewhere.
 *
 * A trace solves `A = B` with the Jacobian `[A_s, A_phi, -B_y, -B_theta]`,
 * which is singular where the two normals are parallel, so a contact that is
 * tangential over an arc cannot be traced however it is parameterized. A shared
 * boundary needs no trace: one owner supplies the loop `x(t) = (y(t),
 * theta(t))` on the host's chart with two derivatives (a port curve, a face's
 * skin cut by a surface fixed in a frame), and the part passes through it by
 * construction. The curve is then `C(t) = B(x(t))` with `C' = B_y y' + B_theta
 * theta'` and `C'' = Q_B + B_y y'' + B_theta theta''` exactly, and the part's
 * preimage is the foot of `C(t)` on the part, solved by Newton on `A_s . (A -
 * C) = 0`, `A_phi . (A - C) = 0`, a problem that stays regular at any angle
 * between the surfaces. The part's rates solve `I_A (s', phi') = (A_s . C',
 * A_phi . C')` and `I_A (s'', phi'') = (A_s . (C'' - Q_A), A_phi . (C'' -
 * Q_A))`, exact where the loop lies on the part and within the gap's order
 * where it stands off by less than the tolerance.
 *
 * What the surfaces decide, with no arc declared: the turn between the two
 * outward normals at each point is the fold's angle, which a `fold` width law
 * reads (`AutoMovieConstructionWidths`); a point where the tangent planes meet
 * under `grazing` is on a smooth arc and any other on a fold arc (`arc`). What
 * the loop decides is only what the normals cannot (`toward`): the host's rail
 * stands outside the loop at every point, and on a smooth arc the part's rail
 * stands where the part runs on from the host across the loop. On a fold arc
 * the part's side is the normals' own, as a traced join reads it. The two
 * readings of the part's side agree wherever both are defined and the part
 * rises from the host inside the loop; a part whose side reverses between
 * neighbouring points passes under its host along an arc and is refused.
 */
export namespace IAutoMovieSolidSharedCurve {
  /**
   * A closed loop on a host face's chart at a clock, radians, with its first
   * and second clock derivatives: one turn over `2 pi`.
   */
  export type Loop = (t: number) => {
    point: [number, number];
    first: [number, number];
    second: [number, number];
  };

  /** What a shared contact is built from. */
  export interface IInput {
    /** The part, `v` periodic where it has a period. */
    part: IAutoMovieSolidSurface;

    /** The host: one surface, or an atlas of which `face` carries the loop. */
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas;

    /** The host face the loop lies on; absent, 0. */
    face?: number;

    /** The loop on that face's chart. */
    loop: Loop;

    /** Points over one turn at the clocks `2 pi i / count`, at least 8. */
    count: number;

    /** Largest distance of a loop point from the part, mm, positive. */
    tolerance: number;

    /**
     * Angle between the tangent planes, radians, under which a point is on a
     * smooth arc and its sides come from the loop.
     */
    grazing: number;

    /**
     * Which side of the host the part keeps: `outside` for a merge, `inside`
     * for a diff.
     */
    keep: IAutoMovieSolidRail.Keep;

    /**
     * The part's chart point near the loop's point at clock 0; absent, the
     * nearest of a grid over the part's declared domain.
     */
    start?: [number, number];
  }

  /**
   * A shared contact: the curve a join composes, and what the loop and the
   * surfaces say at each of its points.
   */
  export interface IShared {
    /**
     * The contact: `parameter` reads `arc`, since its clock is not the part's
     * phase and both rails offset square to it.
     */
    curve: IAutoMovieSolidIntersection.ICurve;

    /**
     * The rails' sides at a point of the curve, or null where a direction
     * vanishes.
     */
    toward: (
      point: IAutoMovieSolidIntersection.IPoint,
    ) => IAutoMovieSolidRail.IToward | null;

    /**
     * The arc a point of the curve lies on: `smooth` where the tangent planes
     * meet under the grazing angle, else `fold`.
     */
    arc: (point: IAutoMovieSolidIntersection.IPoint) => "smooth" | "fold";
  }

  /** The contact, or null with the premise it broke. */
  export interface IResult {
    /** The contact; null when a premise fails. */
    shared: IShared | null;

    /**
     * The broken premises: `shared loop`, `closed loop`, `enclosed loop` or
     * `one kept side`.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
