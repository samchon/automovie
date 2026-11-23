/**
 * A chord from a join's curve to one rail set by the fold the two surfaces make
 * there: `radius tan(beta / 2)`, `beta` the turn between the outward normals of
 * the result's two faces at the traced point (for a diff the part's inward
 * normal, since its inside is kept), capped at `cap`.
 *
 * It is the tangent length of a rolling ball of the stated radius in the fold's
 * normal plane, so a blend widens where the parts meet at a steep angle and
 * narrows where they meet nearly flat, as a skin fold of one radius does. The
 * engine evaluates it at every traced point and reads it between them by the
 * periodic cubic B-spline through those values, C2 round the loop.
 *
 * With `reach` the chord is `hypot(reach, radius tan(beta / 2))`: the fold's
 * term runs out to nothing as the surfaces come tangent (`beta` to 0) and the
 * chord settles on `reach`, the half width of the band that carries the two
 * surfaces into each other where they share their lines. The blend then never
 * turns tighter than the fold's radius (its effective rolling radius `chord /
 * tan(beta / 2)` is at least `radius`) and never narrows to nothing, and the
 * law is smooth in `beta`, so where the surfaces are tangent along an arc of a
 * declared loop (`IAutoMovieConstructionJoin.loop`) and cross along the rest,
 * each arc's width follows from the two surfaces with no arc declared.
 *
 * With `reach` the ball is also read on curved walls: in the plane square to
 * the curve each surface is taken as its circle of curvature across the curve,
 * and the chord runs to the point where the ball of the fold's radius touches
 * that circle, which is exact on a plane, a sphere and a cylinder cut square to
 * its axis and leaves the third-order terms of other walls. The tangent length
 * `radius tan(beta / 2)` alone places a rail `radius^2 tan(beta / 2) k / 2` too
 * far on a wall of curvature `k` away from the ball, 3 % of the chord for 11 mm
 * on a 100 mm sphere.
 *
 * The radius is the ball's, not the blend's tightest: the G2 section has no
 * curvature at either rail, since it takes each wall's own, so it turns tighter
 * than the ball between them. On a flat wedge its middle radius is `2 radius
 * (15 / 8 - 7 cos(beta / 2) / 8)^2 / 3`: two thirds of `radius` for a shallow
 * fold, 0.78 at 0.88 rad, the radius itself near 1.4 rad, more past it. An
 * author who needs a visible radius divides it by that factor.
 *
 * `radii` states a radius that varies round the loop, as a fold deepens along a
 * sulcus: the radius at the curve parameters `2 pi j / m`, joined by the
 * periodic cubic spline, in place of `radius`. A consumer knows a fold's radius
 * at the landmarks of its loop in the host's frame, which a law of the crossing
 * angle could not tell apart where the angle is the same.
 *
 * A fold whose walls face each other is a cleft: as `beta` nears `pi` the ball
 * touches the walls ever farther from their line, and past `cap` it no longer
 * fits between them within the reach the author allows. With `reach` that is
 * refused as `cleft`: the walls there are two sheets in contact, not a fillet.
 * Without `reach` the chord is cut at the cap as before.
 *
 * Engine admission: `radius` and `cap` positive; `reach`, when given, positive;
 * `radii`, when given, at least 3 positive values. With `reach`, at every point
 * whose fold term reaches it, `radius` under the radius of curvature each
 * surface turns toward the fold there (a ball larger than that cannot touch the
 * surface without cutting it: the offset surface at that distance is singular);
 * refused as `fold radius`.
 */
export interface IAutoMovieConstructionFoldWidth {
  /** Discriminator. */
  type: "fold";

  /** The fold's rolling radius, metres, positive. */
  radius: number;

  /** The largest chord, metres, positive. */
  cap: number;

  /**
   * The rolling radius round the loop, metres, positive, at the curve
   * parameters `2 pi j / m`, `m >= 3`, joined by the periodic cubic spline;
   * given, `radius` is not read.
   */
  radii?: number[];

  /**
   * The chord where the surfaces are tangent, metres, positive: the half width
   * of the band over a tangent arc, to which the fold's term adds in
   * quadrature. Absent, the fold's term alone, which is nothing at a tangent
   * contact.
   */
  reach?: number;
}
