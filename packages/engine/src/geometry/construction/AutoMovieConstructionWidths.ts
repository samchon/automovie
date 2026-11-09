import type { AutoMovieConstructionWidth } from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cross, dot, norm, scale } = AutoMovieSolidVector;

/**
 * A join's width records as the kernel's width laws in millimetres (`AutoMovieSolidJoin.IInput.width`).
 *
 * A constant chord is one value; a chord table is the periodic cubic B-spline through its values at uniform curve parameters from 0. The two laws read from the surfaces, the fold's `R tan(beta / 2)` and the curvature's `share / |k|`, are evaluated at every point of the traced curve and read between them by the periodic cubic B-spline through those values from the seed's parameter, so every law is C2 round the loop. A `station` width is the part's fixed rail station under the phase parameter and is refused anywhere else.
 *
 * @evidence contracts/common.md#principled-implementation The fold law is the rolling ball's tangent length `R tan(beta / 2)` and the curvature law a share of the normal-section radius `1 / |k|` from `II(d, d) / I(d, d)`, both read at the traced points and interpolated C2 round the loop.
 * @evidence contracts/common.md#clear-and-simple-design One law builder per width kind; the two surface-read kinds share one traced curve and one periodic spline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported station widths, invalid shares and non-positive supplied chords are refused; fold/curvature caps are part of their declared laws, but sample admission/caps do not certify the interpolated law's range between knots.
 * @evidence contracts/common.md#meaningful-documentation States each kind's law, where it is evaluated and how it is interpolated.
 * @evidence contracts/performance.md#efficient-algorithms A fold law reads both surface jets per traced point and a curvature law one side's jet; each builds an O(n) fixed-filter periodic interpolant, with constant work per later value.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides share the trace, but each independently prepares its law, including repeated fold-normal readings; prepared coefficients serve later evaluations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Periodic laws retain their own O(n) coefficients/start/count; a constant chord callback retains its supplied width record and scale, so callers preserve that record while the join uses it.
 */
export namespace AutoMovieConstructionWidths {
  /**
   * The retained trace and surfaces from which fold/curvature laws read their knots.
   *
   * @evidence contracts/common.md#principled-implementation Connects each traced chart point/tangent to the actual part/host jets and the merge/diff orientation convention.
   * @evidence contracts/common.md#clear-and-simple-design One context shares the existing curve and sides across both width-law builders.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not validate curve closure, uniform parameters, nondegenerate jets or face indices; it relies on the trace owner's admitted output.
   * @evidence contracts/common.md#meaningful-documentation Names part versus host atlas and the diff flag's inward kept-wall meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This context executes no normal, curvature or interpolation algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Both side laws read the same trace and surface identities without tracing a second curve solely for the other side.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its owner temporarily retains the trace and transitive surface/atlas closures during preparation; prepared periodic laws retain derived coefficients, not this context.
   */
  export interface ITraced {
    /** The traced curve. */
    curve: AutoMovieSolidIntersection.ICurve;

    /** The part's surface. */
    part: IAutoMovieSolidSurface;

    /** The host's faces. */
    host: IAutoMovieSolidAtlas;

    /** Whether the join is a diff, whose kept part wall faces into the part. */
    diff: boolean;
  }

  /**
   * Whether a width is read from the traced curve.
   *
   * @param width The width.
   * @returns True for `fold` and `curvature`.
   *
   * @evidence contracts/common.md#principled-implementation The closed width union marks fold and curvature as requiring surface data along the traced contact.
   * @evidence contracts/common.md#clear-and-simple-design One discriminator predicate lets realization decide whether preliminary tracing is required.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Tests only the width kind, not its numerical validity or eventual join success.
   * @evidence contracts/common.md#meaningful-documentation Lists the two true kinds and the query's role.
   * @evidence contracts/performance.md#efficient-algorithms At most two literal comparisons take constant time without allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This kind predicate coordinates no trace or law cache itself.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returning a boolean retains no width record or resource.
   */
  export function traced(width: AutoMovieConstructionWidth): boolean {
    return width.type === "fold" || width.type === "curvature";
  }

  /**
   * The part's and the host's width laws.
   *
   * @param part The part's width.
   * @param host The host's width.
   * @param phase Whether the curve's parameter is the part's phase.
   * @param curve The traced curve and its sides, or null when neither width is read from it.
   * @returns The laws, or the premise one breaks.
   *
   * The periodic interpolant passes through the admitted knot values but is
   * not shape-preserving: positive samples or sampled caps do not guarantee
   * positivity or the same cap between knots. Constant chord callbacks also
   * keep reading their supplied width record, which must remain unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Converts authored metre lengths to kernel mm and prepares the selected constant, periodic chord, fold-angle or normal-curvature law; traced values are uniformly parameterized over one turn by the trace producer.
   * @evidence contracts/common.md#clear-and-simple-design Shared law dispatch handles both sides, with a distinct part-station representation only when the curve uses part phase.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies declared caps and end-distance floor at sampled curvature knots, then uses a non-shape-preserving periodic interpolant; between-knot positivity/cap bounds are not enforced, and positive comparisons alone do not independently reject infinite lengths.
   * @evidence contracts/common.md#meaningful-documentation Gives each law, station restriction, mm conversion, sample/interpolation boundary and constant-callback mutation premise.
   * @evidence contracts/performance.md#efficient-algorithms Constant/station preparation is O(1); a table or traced law uses O(N) fixed-filter preparation and coefficient storage, with two surface jets per fold knot or one per curvature knot and constant later evaluation cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Both sides share the supplied trace, while fold-normal preparation is repeated independently per side; each resulting periodic coefficient array is reused across later rail/column requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned periodic closures own O(N) coefficients/start/count for the join's lifetime; chord closures borrow their input record/scale, and local sampled values/context are released after preparation.
   */
  export function create(
    part: AutoMovieConstructionWidth,
    host: AutoMovieConstructionWidth,
    phase: boolean,
    curve: ITraced | null,
  ): AutoMovieSolidJoin.IInput["width"] | string {
    if (host.type === "station")
      return "a station width is the part's only, never the host's";
    if (part.type === "station" && !phase)
      return "a station width needs the phase parameter";
    const hostLaw: ((t: number) => number) | string = law(host, "host", curve);
    if (typeof hostLaw === "string") return hostLaw;
    if (part.type === "station")
      return {
        part: { station: part.value * AutoMovieConstructionViews.SCALE },
        host: hostLaw,
      };
    const partLaw: ((t: number) => number) | string = law(part, "part", curve);
    if (typeof partLaw === "string") return partLaw;
    return { part: partLaw, host: hostLaw };
  }

  /** One side's law in millimetres. */
  function law(
    width: Exclude<AutoMovieConstructionWidth, { type: "station" }>,
    side: "part" | "host",
    curve: ITraced | null,
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
        if (curve === null) return "the fold width has no traced curve";
        const values: number[] = curve.curve.points.map(
          (p: AutoMovieSolidIntersection.IPoint): number => {
            const beta: number = turn(curve, p);
            return Math.min(width.cap, width.radius * Math.tan(beta / 2)) * S;
          },
        );
        return periodic(values, curve.curve.points[0]!.t);
      }
      case "curvature": {
        if (!(width.share > 0 && width.share < 1 && width.cap > 0))
          return `the ${side} curvature share ${width.share} must lie inside (0, 1) and its cap ${width.cap} m be positive`;
        if (width.end !== null && !(width.end > 0 && width.end < 1))
          return `the ${side} curvature end share ${width.end} must lie inside (0, 1)`;
        if (curve === null) return "the curvature width has no traced curve";
        const values: number[] = curve.curve.points.map(
          (p: AutoMovieSolidIntersection.IPoint): number => {
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
            return k > 0 ? Math.min(cap, width.share / k) : cap;
          },
        );
        return periodic(values, curve.curve.points[0]!.t);
      }
    }
  }

  /**
   * The turn between the outward normals of the result's two faces at a traced point: the host's outward normal and the part's, turned inward for a diff.
   *
   * @param curve The traced curve and its sides.
   * @param p The point.
   * @returns The angle, radians in `[0, pi]`.
   */
  function turn(curve: ITraced, p: AutoMovieSolidIntersection.IPoint): number {
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

  /**
   * The absolute normal curvature of a surface across a curve: in the direction `d = n x T` square to the curve's tangent `T` in the tangent plane, `|II(d, d) / I(d, d)|`.
   *
   * @param j The surface's jet at the point.
   * @param tangent The curve's tangent there.
   * @returns The curvature, 1 per mm, 0 where the chart degenerates.
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

  /**
   * The periodic cubic B-spline through values at uniform parameters from a start, one turn.
   *
   * @param values The values, mm.
   * @param start The parameter of the first value.
   * @returns The law.
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
