import type { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicHermiteField } from "./AutoMovieConicHermiteField";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/** A final projective reading of the unchanged bounded numeric inverse. */
interface Located {
  /** Same final point/log probabilities. */ reading: AutoMovieConicHermiteField.IProjective<number>;
  /** Null only for an explicit endpoint. */ clock: number | null;
  /** Explicit selected position. */ position: "first" | "interior" | "last";
}

/**
 * Convex rational cubic G2 Hermite interpolation of a short conic end.
 *
 * Degree-elevating a rational quadratic gives weights [1,u0,u0,1].
 * For a fixed control polygon, start curvature is proportional to v/u^2
 * and end curvature to u/v^2. Thus [1,u0/tau^(2/3),u0/tau^(1/3),1]
 * changes only the start curvature by tau. This is the standard rational
 * cubic osculatory problem described by Habib and Sakai (2001, p341),
 * https://www.jams.or.jp/scm/contents/Vol-5-5/5-41.pdf .
 *
 * The original segment and this positive-weight convex cubic lie between
 * its chord and first tangent. For T<=1/2 their same-ray radial separation
 * is at most (a-x(T))/cos(phi(T)) <= 4*T^2*hypot(a,b). The chosen T is
 * smaller than the square root of that error budget. It also vanishes
 * linearly with 1-tau. Near tau=1, the radial correction is
 * O((1-tau)*T^2), its phase derivative O((1-tau)*T), and its second phase
 * derivative O(1-tau). Scaling the compact angular interval then makes all
 * mixed derivatives of total order at most two tend to zero. Away from
 * that branch the positive regular rational inverse is smooth.
 *
 * Small x deficits are stored separately from a, avoiding subtraction of
 * nearly equal world coordinates before differentiating.
 *
 * @evidence contracts/common.md#principled-implementation Uses fixed-polygon rational cubic endpoint-curvature interpolation, positive weights, a convex control polygon and the explicit same-ray error bound; polar C2 additionally requires a positive ray derivative.
 * @evidence contracts/common.md#clear-and-simple-design One prepared short arc owns its deficit coordinates, weights and native/angular bounds; the quarter owner composes it with the unchanged conic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source extent, shoulder or specimen is fitted; this is a controlled conic approximation, not exact preservation of the whole conic.
 * @evidence contracts/common.md#meaningful-documentation States the weight derivation, convexity/error premises, vanishing-support C2 argument and numerical representation limit.
 * @evidence contracts/performance.md#efficient-algorithms Preparation is constant work; an interior end-support query uses two bracket readings, at most64 log-odds bisection readings and one final projective reading, at most67 in total. An endpoint uses one reading.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared controls/weights serve all radius and native-arclength readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each caller owns one fixed-size patch; no global source or query cache exists.
 */
export namespace AutoMovieConicHermite {
  /**
   * One short rational cubic in deficit/height coordinates.
   *
   * @evidence contracts/common.md#principled-implementation The native bound and positive rational controls describe the same G2 end arc used by point and arclength readers.
   * @evidence contracts/common.md#clear-and-simple-design Fixed-size geometric data separates preparation from evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores no mesh, sampled fit or alternate anatomical source.
   * @evidence contracts/common.md#meaningful-documentation Members identify physical lengths, dimensionless controls and angular/native bounds.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Data schedules no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The containing source quarter owns these fixed-size arrays.
   */
  export interface IPatch<T = number> {
    /** First support extent, in the source length unit. */
    extent: T;

    /** Positive x deficit at the far endpoint, same length unit. */
    deficit: T;

    /** Positive y at the far endpoint, same length unit. */
    height: T;

    /** Far endpoint in the original quadratic's native parameter. */
    native: T;

    /** Far endpoint polar angle, radians. */
    angle: number;

    /** Shared geometric start curvature, inverse source length. */
    curvature: T;

    /** Four controls [x deficit / deficit, y / height]. */
    points: readonly (readonly [T, T])[];

    /** Four positive rational weights; create normalizes the outer weights to one. */
    weights: readonly T[];
  }

  /**
   * Prepare a convex G2 end approximation or an explicit finite-arithmetic failure.
   *
   * @evidence contracts/common.md#principled-implementation Subdivides and endpoint-normalizes the original quadratic, degree-elevates its convex polygon and changes its inner weights by the derived curvature ratio.
   * @evidence contracts/common.md#clear-and-simple-design Null means no curvature change; a string names failed admission rather than a fallback shape.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps the exact support, far conic point/tangent/curvature and original shoulder; finite positive representability is required.
   * @evidence contracts/common.md#meaningful-documentation Source extents use one length unit, r is in (0,1), and shared must be positive and no greater than own curvature.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and one cube root prepare four controls and weights.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure preparation schedules no effectful work; the containing quarter reuses its result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed-size data, null or one string; nothing is process-retained.
   */
  export function create(
    a: number,
    b: number,
    r: number,
    shared: number,
  ): IPatch | string | null {
    return prepare(AutoMovieConicFieldJet.NUMBER, a, b, r, shared);
  }

  /**
   * Prepare the same rational G2 end in NUMBER or source-Hessian algebra.
   *
   * @evidence contracts/common.md#principled-implementation Original quadratic subdivision, degree elevation and the fixed-polygon curvature-ratio law are shared verbatim across scalar representations.
   * @evidence contracts/common.md#clear-and-simple-design The numeric adapter computes own curvature here and delegates to the shared internal end formula.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Primal admission selects a branch without claiming auxiliary min-curvature branch jets are derivatives at a tie.
   * @evidence contracts/common.md#meaningful-documentation Angle is a primal lookup bound; native support and rational controls retain supplied source derivatives.
   * @evidence contracts/performance.md#efficient-algorithms Constant-size preparation; no length, native-turn partition or cache work occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepared controls serve both numeric and differentiated fixed-clock readings.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed-size scalar/tuple records or a named string escape.
   */
  export function prepare<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    a: T,
    b: T,
    r: T,
    shared: T,
  ): IPatch<T> | string | null {
    const own: T = AutoMovieConicArcField.curvature(ops, a, b, r);
    return AutoMovieConicPreparation.end(ops, a, b, r, shared, own);
  }

  /**
   * Cartesian point and two derivatives in this cubic's own unit parameter.
   *
   * @evidence contracts/common.md#principled-implementation Differentiates the weighted cubic Bernstein numerator/denominator twice, then restores physical deficit and height scales.
   * @evidence contracts/common.md#clear-and-simple-design One native jet serves explicit native-parameter inspection; geometric polar and length readers avoid this potentially ill-conditioned clock.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No world-coordinate control differences or finite differences replace the derivatives.
   * @evidence contracts/common.md#meaningful-documentation Returns [x,y,x_t,y_t,x_tt,y_tt] in source length units per unit-parameter order.
   * @evidence contracts/performance.md#efficient-algorithms Fixed twelve weighted basis accumulations and two quotient recurrences.
   * @evidence contracts/performance.md#reuse-equivalent-work The same loaded weights and basis values serve both coordinates and all derivative orders.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a six-number result escapes; fixed-size scratch is local.
   */
  export function jet(
    patch: IPatch,
    t: number,
  ): [number, number, number, number, number, number] {
    const s: number = 1 - t;
    const basis: number[][] = [
      [s ** 3, 3 * t * s * s, 3 * t * t * s, t ** 3],
      [-3 * s * s, 3 * s * s - 6 * t * s, 6 * t * s - 3 * t * t, 3 * t * t],
      [6 * s, 18 * t - 12, 6 - 18 * t, 6 * t],
    ];
    const d: [number, number, number] = [0, 0, 0];
    const n: [number, number][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    for (let order: number = 0; order < 3; order++)
      for (let i: number = 0; i < 4; i++) {
        const weight: number = basis[order]![i]! * patch.weights[i]!;
        d[order]! += weight;
        n[order]![0] += weight * patch.points[i]![0];
        n[order]![1] += weight * patch.points[i]![1];
      }
    const values: [number, number][] = [
      [n[0]![0] / d[0], n[0]![1] / d[0]],
      [0, 0],
      [0, 0],
    ];
    for (let coordinate: number = 0; coordinate < 2; coordinate++) {
      values[1]![coordinate] =
        (n[1]![coordinate]! - values[0]![coordinate]! * d[1]) / d[0];
      values[2]![coordinate] =
        (n[2]![coordinate]! -
          2 * values[1]![coordinate]! * d[1] -
          values[0]![coordinate]! * d[2]) /
        d[0];
    }
    return [
      patch.extent - patch.deficit * values[0]![0],
      patch.height * values[0]![1],
      -patch.deficit * values[1]![0],
      patch.height * values[1]![1],
      -patch.deficit * values[2]![0],
      patch.height * values[2]![1],
    ];
  }

  /**
   * Polar jet on this admitted end's closed angular interval.
   *
   * @evidence contracts/common.md#principled-implementation Inverts the positive rational curve in log(t/(1-t)), reading normalized homogeneous monomials. Positive pair sums give the tangent and positive triple determinants give curvature; polar derivatives follow their geometric law without a singular native clock.
   * @evidence contracts/common.md#clear-and-simple-design The final projective reading owns point, ray residual, tangent and curvature; the unchanged interior conic uses its existing evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No input or output clamp is used. A nonfinite or outside-support query, unbracketed ray or residual beyond the stated roundoff scale remains nonfinite.
   * @evidence contracts/common.md#meaningful-documentation Local angles are radians; the log bracket derives from binary64's finite exponent span and admitted weights. The residual floor scales with logarithmic arithmetic, not an empirical shape allowance.
   * @evidence contracts/performance.md#efficient-algorithms An interior query uses two bracket point readings, at most64 bisection point readings and one final projective point, at most67 readings in total; an endpoint uses one. Final geometry uses at most six tangent pairs and four curvature triples; midpoint exhaustion terminates earlier.
   * @evidence contracts/performance.md#reuse-equivalent-work The final normalized homogeneous logs serve point, tangent and curvature without another inverse or curvature solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps only the local scalar bracket and final fixed-size jet.
   */
  export function radius(
    patch: IPatch,
    angle: number,
  ): AutoMoviePolarSector.Jet {
    return locate(patch, angle)?.radial ?? [NaN, NaN, NaN];
  }

  /**
   * Locate a G2 ray once, preserving explicit endpoint identities.
   *
   * @evidence contracts/common.md#principled-implementation The unchanged bounded log-odds inverse uses the shared NUMBER projective point; positive geometry supplies phase jets and log curvature.
   * @evidence contracts/common.md#clear-and-simple-design Source readers consume the final clock or endpoint position without another inverse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A null clock is never interpreted as an interior parameter; outside, unbracketed or unresolved rays remain null.
   * @evidence contracts/common.md#meaningful-documentation The descriptor uses the selected end chart; the quarter owner applies reflection once.
   * @evidence contracts/performance.md#efficient-algorithms Two bracket point readings and at most64 numeric-only bisection point readings precede one final projective reading, at most67 in total; endpoints read once.
   * @evidence contracts/performance.md#reuse-equivalent-work Final projective probabilities serve tangent and positive curvature triples.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned numeric record holds no source, algebra table or cache.
   */
  export function locate(
    patch: IPatch,
    angle: number,
  ): AutoMovieConicArc.IRay | null {
    const selected: Located | null = locateReading(patch, angle);
    return selected === null
      ? null
      : AutoMovieConicHermiteField.ray(
          patch,
          selected.reading,
          selected.clock,
          selected.position,
        );
  }

  /**
   * Same admitted ray inverse and projective point without full geometry.
   *
   * @evidence contracts/common.md#principled-implementation Shares the endpoint identities, log-odds bracket, bisections and final residual with locate.
   * @evidence contracts/common.md#clear-and-simple-design Only the final tangent/curvature conversion is omitted by the value capability.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No iteration, floor, weight normalization, reflection or point arithmetic changes; uncomputed phase jets are not promised.
   * @evidence contracts/common.md#meaningful-documentation Returns fresh physical end-chart coordinates or null on invalid angle, unresolved inverse or nonfinite point.
   * @evidence contracts/performance.md#efficient-algorithms The same at most67 projective readings omit the final six tangent pairs and four curvature triples.
   * @evidence contracts/performance.md#reuse-equivalent-work The exact inverse and final projective point are shared with the full reader.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local bracket/reading records die after the fresh pair is returned; no query cache.
   */
  export function point(
    patch: IPatch,
    angle: number,
  ): readonly [number, number] | null {
    const selected: Located | null = locateReading(patch, angle);
    return selected !== null && selected.reading.point.every(Number.isFinite)
      ? selected.reading.point
      : null;
  }

  /** The original inverse, including its exact endpoint and residual policy. */
  function locateReading(patch: IPatch, angle: number): Located | null {
    if (!(Number.isFinite(angle) && angle >= 0 && angle <= patch.angle))
      return null;

    const ops: AutoMovieConicFieldJet.IAlgebra<number> =
      AutoMovieConicFieldJet.NUMBER;
    const weightLogs: number[] = patch.weights.map(Math.log);
    if (!weightLogs.every(Number.isFinite)) return null;

    if (angle === 0 || angle === patch.angle) {
      const position: "first" | "last" = angle === 0 ? "first" : "last";
      const reading: AutoMovieConicHermiteField.IProjective<number> =
        AutoMovieConicHermiteField.projective(
          ops,
          patch,
          weightLogs,
          null,
          position,
        );
      return { reading, clock: null, position };
    }
    const span: number =
      Math.log(Number.MAX_VALUE) -
      Math.log(Number.MIN_VALUE) +
      Math.max(...weightLogs.map(Math.abs));
    let lo: number = -span;
    let hi: number = span;
    const below: AutoMovieConicHermiteField.IProjective<number> =
      AutoMovieConicHermiteField.projective(ops, patch, weightLogs, lo);
    const above: AutoMovieConicHermiteField.IProjective<number> =
      AutoMovieConicHermiteField.projective(ops, patch, weightLogs, hi);
    if (
      !(
        Math.atan2(below.point[1], below.point[0]) <= angle &&
        angle <= Math.atan2(above.point[1], above.point[0])
      )
    )
      return null;
    for (let i: number = 0; i < 64; i++) {
      const middle: number = (lo + hi) / 2;
      if (middle === lo || middle === hi) break;
      const reading: AutoMovieConicHermiteField.IProjective<number> =
        AutoMovieConicHermiteField.projective(ops, patch, weightLogs, middle);
      if (Math.atan2(reading.point[1], reading.point[0]) < angle) lo = middle;
      else hi = middle;
    }
    const clock: number = (lo + hi) / 2;
    const reading: AutoMovieConicHermiteField.IProjective<number> =
      AutoMovieConicHermiteField.projective(ops, patch, weightLogs, clock);
    const residual: number = Math.abs(
      Math.atan2(reading.point[1], reading.point[0]) - angle,
    );
    const floor: number =
      128 *
      Number.EPSILON *
      (1 + Math.abs(clock) + Math.max(...weightLogs.map(Math.abs))) *
      patch.angle;
    if (!(Number.isFinite(residual) && residual <= floor)) return null;

    return { reading, clock, position: "interior" };
  }
}
