import type {
  AutoMovieSolidVector,
  IAutoMovieSolidSurface,
} from "@automovie/engine";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * Closed-form solid surfaces for the solid operators' tests: a cylinder, a
 * plane and a sphere with their exact first and second partial derivatives,
 * so every expected curve, rail and blend is a known formula and no reading
 * depends on the code under test.
 *
 * Each surface's outward side is derived from its frame's handedness, so a
 * test states which side is the solid by the frame it passes.
 */
export namespace HumanSolidShapes {
  /**
   * A circular cylinder `o + s d + r (cos phi e1 + sin phi e2)`, `u = s` along
   * its axis and `v = phi`, period `2 pi`, outward away from its axis.
   *
   * @param name Name in diagnostics.
   * @param o A point of the axis, mm.
   * @param d Unit axis direction.
   * @param e1 Unit radial direction at `phi = 0`, perpendicular to `d`.
   * @param e2 Unit radial direction at `phi = pi / 2`, perpendicular to both.
   * @param r Radius, mm.
   * @returns The surface.
   */
  export function cylinder(
    name: string,
    o: Vec3,
    d: Vec3,
    e1: Vec3,
    e2: Vec3,
    r: number,
  ): IAutoMovieSolidSurface {
    // `S_u x S_v = r (d x (-sin e1 + cos e2))`, which for a right-handed
    // (d, e1, e2) is `-r (cos e1 + sin e2)`, into the axis.
    const handed: number = dot(cross(d, e1), e2);
    return {
      name,
      period: 2 * Math.PI,
      orientation: handed > 0 ? -1 : 1,
      jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
        const c: number = Math.cos(phi);
        const n: number = Math.sin(phi);
        return {
          p: sum([1, o], [s, d], [r * c, e1], [r * n, e2]),
          u: [d[0], d[1], d[2]],
          v: sum([-r * n, e1], [r * c, e2]),
          uu: [0, 0, 0],
          uv: [0, 0, 0],
          vv: sum([-r * c, e1], [-r * n, e2]),
        };
      },
    };
  }

  /**
   * A plane `o + u a + v b`, not periodic, outward along `out`.
   *
   * @param name Name in diagnostics.
   * @param o Its origin, mm.
   * @param a Unit direction of `u`.
   * @param b Unit direction of `v`, perpendicular to `a`.
   * @param out The outward side, any vector off the plane.
   * @returns The surface.
   */
  export function plane(
    name: string,
    o: Vec3,
    a: Vec3,
    b: Vec3,
    out: Vec3,
  ): IAutoMovieSolidSurface {
    return {
      name,
      orientation: dot(cross(a, b), out) > 0 ? 1 : -1,
      jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
        p: sum([1, o], [u, a], [v, b]),
        u: [a[0], a[1], a[2]],
        v: [b[0], b[1], b[2]],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, 0, 0],
      }),
    };
  }

  /**
   * A sphere `c + R (sin s cos phi e1 + sin s sin phi e2 + cos s e3)`, `u = s`
   * the polar angle from `e3` and `v = phi`, period `2 pi`, outward away
   * from its centre.
   *
   * @param name Name in diagnostics.
   * @param c Centre, mm.
   * @param e1 Unit direction at `s = pi / 2, phi = 0`.
   * @param e2 Unit direction at `s = pi / 2, phi = pi / 2`.
   * @param e3 Unit polar axis.
   * @param R Radius, mm.
   * @returns The surface.
   */
  export function sphere(
    name: string,
    c: Vec3,
    e1: Vec3,
    e2: Vec3,
    e3: Vec3,
    R: number,
  ): IAutoMovieSolidSurface {
    // At s = pi / 2, phi = 0: `S_u x S_v = R^2 (-e3) x e2`, which is `R^2 e1`,
    // outward, for a right-handed (e1, e2, e3).
    const handed: number = dot(cross(e1, e2), e3);
    return {
      name,
      period: 2 * Math.PI,
      orientation: handed > 0 ? 1 : -1,
      jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
        const cs: number = Math.cos(s);
        const ss: number = Math.sin(s);
        const cp: number = Math.cos(phi);
        const sp: number = Math.sin(phi);
        return {
          p: sum([1, c], [R * ss * cp, e1], [R * ss * sp, e2], [R * cs, e3]),
          u: sum([R * cs * cp, e1], [R * cs * sp, e2], [-R * ss, e3]),
          v: sum([-R * ss * sp, e1], [R * ss * cp, e2]),
          uu: sum([-R * ss * cp, e1], [-R * ss * sp, e2], [-R * cs, e3]),
          uv: sum([-R * cs * sp, e1], [R * cs * cp, e2]),
          vv: sum([-R * ss * cp, e1], [-R * ss * sp, e2]),
        };
      },
    };
  }

  /**
   * A weighted sum of vectors.
   *
   * @param terms Pairs of weight and vector.
   * @returns The sum.
   */
  export function sum(...terms: [number, Readonly<Vec3>][]): Vec3 {
    const out: Vec3 = [0, 0, 0];
    for (const [k, a] of terms)
      for (let i: number = 0; i < 3; i++) out[i] += k * a[i]!;
    return out;
  }

  /**
   * The dot product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a . b`.
   */
  export function dot(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * The cross product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a x b`.
   */
  export function cross(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * The distance between two points.
   *
   * @param a One point.
   * @param b The other.
   * @returns `|a - b|`.
   */
  export function distance(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
