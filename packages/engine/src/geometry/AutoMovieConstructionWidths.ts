import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionWidth,
  IAutoMovieConstructionWidths,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieSolidFoldContact } from "./construction/internal/AutoMovieSolidFoldContact";

/**
 * A join's width records as the kernel's width laws in millimetres
 * (`IAutoMovieSolidJoin.IInput.width`).
 *
 * A fold's radius is one value or, with `radii`, the periodic cubic through a
 * table of values round the loop. With a `reach` the ball's term is each side's
 * own chord to the ball's contact on its wall's circle of curvature across the
 * curve (`AutoMovieSolidFoldContact`), exact on planes, spheres and cylinders
 * cut square to their axes and equal to `R tan(beta / 2)` on a wedge, and a
 * ball whose tangent length passes the cap is refused as `cleft` instead of
 * being cut at it.
 *
 * A fold with a `reach` reads `hypot(reach, R tan(beta / 2))` on a wedge:
 * between a constant radius, whose tangent length vanishes with the turn, and a
 * constant range distance, whose radius `d / tan(beta / 2)` grows without bound
 * as the turn closes (Chuang and Hwang 1997, variable-radius blending by
 * constrained spine generation, section 3), it keeps the rolling radius `chord
 * / tan(beta / 2)` at least `R` on a fold and the chord at least the reach on a
 * tangent arc, smoothly between. Where the ball governs the chord (`R tan(beta
 * / 2)` at least the reach) its radius must fit both surfaces (`concave`), or
 * the law is refused as `fold radius`.
 *
 * A constant chord is one value; a chord table is the periodic cubic B-spline
 * through its values at uniform curve parameters from 0. The two laws read from
 * the surfaces, the fold's `R tan(beta / 2)` and the curvature's `share /
 * max(|k|, kappa_g)` (`kappa_g` the curve's geodesic curvature toward a
 * square-offset rail, `toward`), are evaluated at every point of the traced
 * curve and read between them by the periodic cubic B-spline through those
 * values from the seed's parameter, so every law is C2 round the loop. A
 * `station` width is the part's fixed rail station under the phase parameter
 * and is refused anywhere else.
 */
export namespace AutoMovieConstructionWidths {
  /**
   * Whether a width is read from the traced curve.
   *
   * @param width The width.
   * @returns True for `fold` and `curvature`.
   */
  export function traced(width: IAutoMovieConstructionWidth): boolean {
    return width.type === "fold" || width.type === "curvature";
  }

  /**
   * The part's and the host's width laws.
   *
   * @param part The part's width.
   * @param host The host's width.
   * @param phase Whether the curve's parameter is the part's phase.
   * @param curve The traced curve and its sides, or null when neither width is
   *   read from it.
   * @returns The laws, or the premise one breaks.
   *
   *   The periodic interpolant passes through the admitted knot values but is not
   *   shape-preserving: positive samples or sampled caps do not guarantee
   *   positivity or the same cap between knots. Constant chord callbacks also
   *   keep reading their supplied width record, which must remain unchanged.
   *
   *   A curvature law also keeps every square-offset rail a regular offset of the
   *   curve (`toward`): the host's rail always, the part's unless the curve
   *   uses its phase, whose station rail does not offset square. A constant
   *   chord or table gets no such bound: a chord past that radius folds the
   *   blend and the join refuses it (`IAutoMovieConstructionWidth`).
   */
  export function create(
    part: IAutoMovieConstructionWidth,
    host: IAutoMovieConstructionWidth,
    phase: boolean,
    curve: IAutoMovieConstructionWidths.ITraced | null,
  ): IAutoMovieSolidJoin.IInput["width"] | string {
    if (host.type === "station")
      return "a station width is the part's only, never the host's";
    if (part.type === "station" && !phase)
      return "a station width needs the phase parameter";
    const hostLaw: ((t: number) => number) | string = law(
      host,
      "host",
      true,
      curve,
    );
    if (typeof hostLaw === "string") return hostLaw;
    if (part.type === "station")
      return {
        part: { station: part.value * AutoMovieConstructionViews.SCALE },
        host: hostLaw,
      };

    // The part's rail offsets square to the curve unless the curve uses the part's phase (`AutoMovieSolidJoin`'s rail mode).
    const partLaw: ((t: number) => number) | string = law(
      part,
      "part",
      !phase,
      curve,
    );
    if (typeof partLaw === "string") return partLaw;
    return { part: partLaw, host: hostLaw };
  }

  /*
   * One side's law in millimetres; `square` says whether that side's rail
   * offsets square to the curve, where the curvature law also bounds the chord
   * by the curve's own bend toward the rail (`bend`).
   */
  function law(
    width: Exclude<IAutoMovieConstructionWidth, { type: "station" }>,
    side: "part" | "host",
    square: boolean,
    curve: IAutoMovieConstructionWidths.ITraced | null,
  ): ((t: number) => number) | string {
    const S: number = AutoMovieConstructionViews.SCALE;
    switch (width.type) {
      case "chord":
        if (!(width.value > 0))
          return `the ${side} chord ${width.value} m is not positive`;
        return (): number => width.value * S;
      case "chords": {
        if (
          !(width.values.length >= 4) ||
          !width.values.every((v: number): boolean => v > 0)
        )
          return `the ${side} chord table needs at least four positive values`;
        return periodic(
          width.values.map((v: number): number => v * S),
          0,
        );
      }
      case "fold": {
        if (!(width.radius > 0 && width.cap > 0))
          return `the ${side} fold radius ${width.radius} m and cap ${width.cap} m must be positive`;
        if (width.reach !== undefined && !(width.reach > 0))
          return `the ${side} fold reach ${width.reach} m must be positive`;
        if (
          width.radii !== undefined &&
          !(
            width.radii.length >= 3 &&
            width.radii.every((x: number): boolean => x > 0)
          )
        )
          return `the ${side} fold radii need at least three positive values`;
        if (curve === null) return "the fold width has no traced curve";
        const reach: number | undefined = width.reach;

        // The rolling radius at a parameter: the one radius, or the periodic cubic through the table's values.
        const radius: (t: number) => number =
          width.radii === undefined
            ? (): number => width.radius
            : periodic(width.radii, 0);
        const values: number[] = [];
        for (const p of curve.curve.points) {
          const R: number = radius(p.t);
          if (!(R > 0))
            return `the ${side} fold radius read between its table's values is not positive at parameter ${p.t}`;
          const beta: number = turn(curve, p);
          const ball: number = R * Math.tan(beta / 2);

          // Without a reach, the ball's tangent length alone, cut at the cap.
          if (reach === undefined) {
            values.push(Math.min(width.cap, ball) * S);
            continue;
          }

          // A cleft: the ball touches the walls past the cap, so it does not fit between them within the reach the author allows.
          if (ball > width.cap)
            return `cleft: the walls turn ${beta} rad at parameter ${p.t}, so a ball of radius ${R * S} mm touches them ${ball * S} mm from their line, past the cap ${width.cap * S} mm; they face each other as two sheets in contact, not as a fold`;

          // A ball that governs the chord must fit both surfaces: its radius under the radius each turns toward the fold (`concave`).
          if (ball >= reach) {
            const bend: number = concave(curve, p, side);
            if (!(R * S * bend < 1))
              return `fold radius: the ${side}'s surface turns toward the fold on a radius of ${1 / bend} mm at parameter ${p.t}, under the fold radius ${R * S} mm, so a ball of that radius cannot touch it there`;
          }

          // The ball's contact on this side's wall as its circle of curvature across the curve; the wedge's tangent length where the
          // walls make no fold to solve. The two in quadrature with the reach: the fold's term runs out as the surfaces come tangent.
          const contact: { host: number; part: number } | null =
            AutoMovieSolidFoldContact.chords(
              curve.part,
              curve.host.faces[p.face]!,
              curve.diff,
              p,
              R * S,
            );
          const chord: number = contact === null ? ball : contact[side] / S;
          values.push(Math.min(width.cap, Math.hypot(reach, chord)) * S);
        }
        return periodic(values, curve.curve.points[0]!.t);
      }
      case "curvature": {
        if (!(width.share > 0 && width.share < 1 && width.cap > 0))
          return `the ${side} curvature share ${width.share} must lie inside (0, 1) and its cap ${width.cap} m be positive`;
        if (width.end !== null && !(width.end > 0 && width.end < 1))
          return `the ${side} curvature end share ${width.end} must lie inside (0, 1)`;
        if (curve === null) return "the curvature width has no traced curve";
        const values: number[] = curve.curve.points.map(
          (p: IAutoMovieSolidIntersection.IPoint): number => {
            const k: number =
              side === "part"
                ? across(curve.part.jet(p.s, p.phi), p.tangent)
                : across(
                    curve.host.faces[p.face]!.jet(p.y, p.theta),
                    p.tangent,
                  );
            // The end bound: a share of the station distance to the rail surface's nearer end, so a rail near a pole stays on the surface.
            const surface: IAutoMovieSolidSurface =
              side === "part" ? curve.part : curve.host.faces[p.face]!;
            const station: number = side === "part" ? p.s : p.y;
            const reach: number =
              surface.domain === undefined || width.end === null
                ? Infinity
                : width.end *
                  Math.min(
                    station - surface.domain[0],
                    surface.domain[1] - station,
                  );
            const cap: number = Math.min(width.cap * S, Math.max(0, reach));

            // The tighter of the two radii the rail must stay inside: the surface's turn across the curve and, for a square
            // offset, the curve's own turn toward the rail. Where the curve's is not the tighter, `bend` is `k` itself.
            const bend: number = square
              ? Math.max(k, toward(curve, p, side))
              : k;
            return bend > 0 ? Math.min(cap, width.share / bend) : cap;
          },
        );
        return periodic(values, curve.curve.points[0]!.t);
      }
    }
  }

  /*
   * The turn between the outward normals of the result's two faces at a traced
   * point: the host's outward normal and the part's, turned inward for a diff.
   * Parameter curve: The traced curve and its sides.
   * Parameter p: The point.
   * Returns: The angle, radians in `[0, pi]`.
   */
  function turn(
    curve: IAutoMovieConstructionWidths.ITraced,
    p: IAutoMovieSolidIntersection.IPoint,
  ): number {
    const face: IAutoMovieSolidSurface = curve.host.faces[p.face]!;
    const h: IAutoMovieSolidSurface.IJet = face.jet(p.y, p.theta);
    const q: IAutoMovieSolidSurface.IJet = curve.part.jet(p.s, p.phi);
    const nh: Vec3 = scale(cross(h.u, h.v), face.orientation);
    const np: Vec3 = scale(
      cross(q.u, q.v),
      curve.part.orientation * (curve.diff ? -1 : 1),
    );
    const c: number = dot(nh, np) / (norm(nh) * norm(np));
    return Math.acos(Math.max(-1, Math.min(1, c)));
  }

  /*
   * The greater principal curvature of one side's surface at a traced point,
   * signed positive where the surface turns toward its outward normal, the side
   * a fold's ball rolls on: the inverse of the largest ball that touches the
   * surface there without cutting it.
   *
   * The surface offset by `d` along its normal is regular while `(1 - d k1)(1 -
   * d k2) > 0` for the principal curvatures toward that normal, and has a
   * cuspidal edge where either reaches `1 / d` (Hartmann, Geometry and
   * Algorithms for Computer Aided Design, lemma 5.2; Patrikalakis and Maekawa,
   * Shape Interrogation, eq. 11.28). A rolling ball's centre runs on that
   * offset, so its radius must stay under `1 / max(k1, k2)`. The curvatures are
   * the roots of `k^2 - 2 H k + K`, `H` and `K` the mean and Gaussian
   * curvatures from the two fundamental forms; the outward normal is the
   * host's, and the part's turned inward for a diff, as `turn` reads them.
   * Parameter curve: The traced curve and its sides.
   * Parameter p: The traced point.
   * Parameter side: Which surface.
   * Returns: The curvature, 1 per mm; 0 or less where the surface turns away
   * from the fold in every direction or its chart degenerates.
   */
  function concave(
    curve: IAutoMovieConstructionWidths.ITraced,
    p: IAutoMovieSolidIntersection.IPoint,
    side: "part" | "host",
  ): number {
    const face: IAutoMovieSolidSurface = curve.host.faces[p.face]!;
    const j: IAutoMovieSolidSurface.IJet =
      side === "part" ? curve.part.jet(p.s, p.phi) : face.jet(p.y, p.theta);
    const sign: number =
      side === "part"
        ? curve.part.orientation * (curve.diff ? -1 : 1)
        : face.orientation;
    const n: Vec3 = cross(j.u, j.v);
    const length: number = norm(n);
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const det: number = E * G - F * F;
    if (!(length > 0 && det > 0)) return 0;

    // The second fundamental form along the outward normal.
    const L: number = (sign * dot(j.uu, n)) / length;
    const M: number = (sign * dot(j.uv, n)) / length;
    const N: number = (sign * dot(j.vv, n)) / length;
    const mean: number = (E * N - 2 * F * M + G * L) / (2 * det);
    const gauss: number = (L * N - M * M) / det;
    return mean + Math.sqrt(Math.max(0, mean * mean - gauss));
  }

  /*
   * The traced curve's geodesic curvature in one side's surface, signed
   * positive where the curve turns toward that side's rail: the inverse radius
   * past which a square offset of the curve stops being regular.
   *
   * An offset of a curve at distance `d` across its surface moves along the
   * curve at `1 - kappa_g d` times the curve's speed, `kappa_g` the curve's
   * geodesic curvature toward the offset, so it stalls at `d = 1 / kappa_g` and
   * runs backward past it, a cusp that folds the blend (Farouki and Neff 1990,
   * analytic properties of offset curves; the cusp stands where the offset
   * distance reaches the radius of curvature). The curvature vector is the
   * intersection curve's own (Ye and Maekawa 1999, differential geometry of
   * intersection curves of two surfaces): the trace's `second`, the implicit
   * second derivative of both surfaces' meeting, less its part along the
   * tangent, over the squared speed. Its component along the unit direction `n
   * x T` square to the curve in the side's tangent plane is the geodesic
   * curvature there. The rail's side of that direction is
   * `AutoMovieSolidRail.at`'s: the part's toward the host's outward normal for
   * a merge and against it for a diff, the host's toward the part's outward
   * normal.
   * Parameter curve: The traced curve and its sides.
   * Parameter p: The traced point.
   * Parameter side: Which surface's rail.
   * Returns: The curvature, 1 per mm; 0 where the speed, the normal or the side
   * vanishes, where the rail solve refuses too.
   */
  function toward(
    curve: IAutoMovieConstructionWidths.ITraced,
    p: IAutoMovieSolidIntersection.IPoint,
    side: "part" | "host",
  ): number {
    const face: IAutoMovieSolidSurface = curve.host.faces[p.face]!;
    const a: IAutoMovieSolidSurface.IJet = curve.part.jet(p.s, p.phi);
    const b: IAutoMovieSolidSurface.IJet = face.jet(p.y, p.theta);
    const speed: number = dot(p.tangent, p.tangent);
    if (!(speed > 0)) return 0;

    // The curve's curvature vector: the second derivative less its tangential part, over the squared speed.
    const along: number = dot(p.second, p.tangent) / speed;
    const k: Vec3 = scale(
      [
        p.second[0] - along * p.tangent[0],
        p.second[1] - along * p.tangent[1],
        p.second[2] - along * p.tangent[2],
      ],
      1 / speed,
    );

    // The side's square direction and the normal the rail turns toward (`AutoMovieSolidRail.at`).
    const own: IAutoMovieSolidSurface.IJet = side === "part" ? a : b;
    const n: Vec3 = cross(own.u, own.v);
    const d: Vec3 = cross(n, p.tangent);
    const length: number = norm(d);
    if (!(length > 0)) return 0;
    const target: Vec3 =
      side === "part"
        ? scale(cross(b.u, b.v), face.orientation * (curve.diff ? -1 : 1))
        : scale(cross(a.u, a.v), curve.part.orientation);
    const facing: number = dot(d, target);
    if (!(Math.abs(facing) > 0)) return 0;
    return (dot(k, d) / length) * Math.sign(facing);
  }

  /*
   * The absolute normal curvature of a surface across a curve: in the direction
   * `d = n x T` square to the curve's tangent `T` in the tangent plane, `|II(d,
   * d) / I(d, d)|`.
   * Parameter j: The surface's jet at the point.
   * Parameter tangent: The curve's tangent there.
   * Returns: The curvature, 1 per mm, 0 where the chart degenerates.
   */
  function across(j: IAutoMovieSolidSurface.IJet, tangent: Vec3): number {
    const n: Vec3 = cross(j.u, j.v);
    const ln: number = norm(n);
    if (!(ln > 0)) return 0;
    const unit: Vec3 = scale(n, 1 / ln);
    const d: Vec3 = cross(unit, tangent);
    // d = a S_u + b S_v by the first fundamental form.
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const du: number = dot(d, j.u);
    const dv: number = dot(d, j.v);
    const det: number = E * G - F * F;
    if (!(det > 0)) return 0;
    const a: number = (G * du - F * dv) / det;
    const b: number = (E * dv - F * du) / det;
    const first: number = a * a * E + 2 * a * b * F + b * b * G;
    if (!(first > 0)) return 0;
    const second: number =
      a * a * dot(j.uu, unit) +
      2 * a * b * dot(j.uv, unit) +
      b * b * dot(j.vv, unit);
    return Math.abs(second / first);
  }

  /*
   * The periodic cubic B-spline through values at uniform parameters from a
   * start, one turn.
   * Parameter values: The values, mm.
   * Parameter start: The parameter of the first value.
   * Returns: The law.
   */
  function periodic(
    values: readonly number[],
    start: number,
  ): (t: number) => number {
    const n: number = values.length;
    const coefficients: number[] = AutoMovieSplineCurve.interpolate(
      values.map((v: number): [number, number] => [v, 0]),
    );
    return (t: number): number =>
      AutoMovieSplineCurve.evaluate(coefficients, n, t - start)[0];
  }
}

const { cross, dot, norm, scale } = AutoMovieSolidVector;

type Vec3 = AutoMovieVector3Tuple;
