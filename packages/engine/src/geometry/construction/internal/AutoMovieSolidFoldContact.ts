import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "../../AutoMovieSolidVector";

/*
 * Where a ball rolling in a fold touches its two walls, read in the plane
 * square to the fold's curve with each wall as its circle of curvature across
 * the curve.
 *
 * In that plane the host's section leaves the curve point `X` along its kept
 * direction `e_h` and bends toward its outward normal `n_h` with the normal
 * curvature `k_h = II(e_h, e_h)`, and the part's likewise. A section taken as
 * its circle of curvature is `P(u) = X + e sin(k u) / k + n (1 - cos(k u)) / k`
 * at the arc length `u`, with the outward normal `N(u) = n cos(k u) - e sin(k
 * u)`; a ball of radius `R` that touches it there has its centre at `P(u) + R
 * N(u)`. The two walls' centres agree at the ball: two equations in the two arc
 * lengths, solved by Newton from the wedge's tangent length `R tan(beta / 2)`,
 * with `d/du (P + R N) = (1 - R k) T(u)`. The chord of each wall is the
 * straight distance from `X` to its contact. It is exact on walls whose
 * sections are circles or lines (a plane, a sphere, a cylinder cut square to
 * its axis), and leaves the walls' third-order terms elsewhere; the wedge's
 * tangent length is its limit as both curvatures vanish (Choi and Ju 1989 and
 * Chuang and Hwang 1997 define the same ball by the offsets' intersection, read
 * here in the section instead of marched).
 */
export namespace AutoMovieSolidFoldContact {
  /*
   * Newton steps of one contact.
   */
  export const STEPS: number = 40;

  /*
   * Relative residual between the two centres a contact accepts, of the radius.
   */
  export const ROUNDING: number = 1e-13;

  /*
   * The chords from a fold's curve point to the ball's two contacts.
   * Parameter part: The part's surface.
   * Parameter face: The host face the point lies on.
   * Parameter diff: Whether the join is a diff, whose kept part wall faces into the
   * part.
   * Parameter p: The curve point with both preimages.
   * Parameter radius: The ball's radius, mm.
   * Returns: The host's and the part's chord, mm, or null where the walls do
   * not make a fold there or the solve does not settle.
   */
  export function chords(
    part: IAutoMovieSolidSurface,
    face: IAutoMovieSolidSurface,
    diff: boolean,
    p: IAutoMovieSolidIntersection.IPoint,
    radius: number,
  ): { host: number; part: number } | null {
    const a: IJet = part.jet(p.s, p.phi);
    const b: IJet = face.jet(p.y, p.theta);
    const along: Vec3 | null = unit(p.tangent);
    const rawA: Vec3 | null = unit(cross(a.u, a.v));
    const rawB: Vec3 | null = unit(cross(b.u, b.v));
    if (along === null || rawA === null || rawB === null) return null;

    // Both outward normals read in the plane square to the curve: a curve that lies on one wall and within a tolerance of the other is
    // tangent to the second only to that tolerance, and the section's two circles must lie in one plane to meet.
    const inPlane = (n: Vec3, sign: number): Vec3 | null =>
      unit(scale(sub(n, scale(along, dot(n, along))), sign));
    const nA: Vec3 | null = inPlane(rawA, part.orientation * (diff ? -1 : 1));
    const nB: Vec3 | null = inPlane(rawB, face.orientation);
    if (nA === null || nB === null) return null;

    /*
     * One wall in the section: its kept direction, toward the other wall's
     * outward normal, and its curvature toward its own.
     */
    const wall = (
      j: IJet,
      own: Vec3,
      other: Vec3,
    ): { e: Vec3; n: Vec3; k: number } | null => {
      const square: Vec3 | null = unit(cross(own, along));
      if (square === null) return null;
      const facing: number = dot(square, other);
      if (!(Math.abs(facing) > 1e-9)) return null;
      const e: Vec3 = scale(square, facing > 0 ? 1 : -1);
      const chart: [number, number] | null = solve2(
        dot(j.u, j.u),
        dot(j.u, j.v),
        dot(j.u, j.v),
        dot(j.v, j.v),
        [dot(e, j.u), dot(e, j.v)],
      );
      if (chart === null) return null;
      const [x, y]: [number, number] = chart;
      return {
        e,
        n: own,
        k:
          x * x * dot(j.uu, own) +
          2 * x * y * dot(j.uv, own) +
          y * y * dot(j.vv, own),
      };
    };
    const host: { e: Vec3; n: Vec3; k: number } | null = wall(b, nB, nA);
    const mound: { e: Vec3; n: Vec3; k: number } | null = wall(a, nA, nB);
    if (host === null || mound === null) return null;

    /*
     * A wall's circle at an arc length: its point from the curve point, the
     * ball's centre from it and the centre's rate.
     */
    const section = (
      w: { e: Vec3; n: Vec3; k: number },
      u: number,
    ): { point: Vec3; centre: Vec3; rate: Vec3 } => {
      const x: number = w.k * u;
      const small: boolean = Math.abs(x) < 1e-4;
      const sine: number = small ? u * (1 - (x * x) / 6) : Math.sin(x) / w.k;
      const versine: number = small
        ? ((w.k * u * u) / 2) * (1 - (x * x) / 12)
        : (1 - Math.cos(x)) / w.k;
      const point: Vec3 = combine([
        [sine, w.e],
        [versine, w.n],
      ]);
      const normal: Vec3 = combine([
        [Math.cos(x), w.n],
        [-Math.sin(x), w.e],
      ]);
      const tangent: Vec3 = combine([
        [Math.cos(x), w.e],
        [Math.sin(x), w.n],
      ]);
      return {
        point,
        centre: combine([
          [1, point],
          [radius, normal],
        ]),
        rate: scale(tangent, 1 - radius * w.k),
      };
    };

    // From the wedge's tangent length, bring the two centres together.
    const beta: number = Math.acos(Math.max(-1, Math.min(1, dot(nA, nB))));
    let uh: number = radius * Math.tan(beta / 2);
    let up: number = uh;
    for (let step: number = 0; step < STEPS; ++step) {
      const h: { point: Vec3; centre: Vec3; rate: Vec3 } = section(host, uh);
      const m: { point: Vec3; centre: Vec3; rate: Vec3 } = section(mound, up);
      const gap: Vec3 = sub(h.centre, m.centre);
      if (norm(gap) <= ROUNDING * radius)
        return uh > 0 && up > 0
          ? { host: norm(h.point), part: norm(m.point) }
          : null;
      const move: [number, number] | null = solve2(
        dot(h.rate, h.rate),
        -dot(h.rate, m.rate),
        -dot(h.rate, m.rate),
        dot(m.rate, m.rate),
        [-dot(h.rate, gap), dot(m.rate, gap)],
      );
      if (move === null) return null;
      uh += move[0];
      up += move[1];
    }

    // The steps ran out above the residual's bound: the contact stands where the last step left it only if that step no longer moved it.
    const h: { point: Vec3; centre: Vec3; rate: Vec3 } = section(host, uh);
    const m: { point: Vec3; centre: Vec3; rate: Vec3 } = section(mound, up);
    return uh > 0 && up > 0 && norm(sub(h.centre, m.centre)) <= 1e-9 * radius
      ? { host: norm(h.point), part: norm(m.point) }
      : null;
  }
}

const {
  combine,
  cross,
  dot,
  norm,
  scale,
  solve2,
  sub,
  unit,
}: typeof AutoMovieSolidVector = AutoMovieSolidVector;
/*
 * World vector, mm.
 */
type Vec3 = AutoMovieVector3Tuple;

/*
 * A surface's 2-jet.
 */
type IJet = IAutoMovieSolidSurface.IJet;
