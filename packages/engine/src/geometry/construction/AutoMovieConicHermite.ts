import { AutoMovieConicArc } from "./AutoMovieConicArc";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

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
 * @evidence contracts/performance.md#efficient-algorithms Preparation is constant work; a rare end-support ray uses at most64 monotone log-odds bisections and fixed-size homogeneous geometric readings.
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
  export interface IPatch {
    /** First support extent, in the source length unit. */
    extent: number;

    /** Positive x deficit at the far endpoint, same length unit. */
    deficit: number;

    /** Positive y at the far endpoint, same length unit. */
    height: number;

    /** Far endpoint in the original quadratic's native parameter. */
    native: number;

    /** Far endpoint polar angle, radians. */
    angle: number;

    /** Shared geometric start curvature, inverse source length. */
    curvature: number;

    /** Four controls [x deficit / deficit, y / height]. */
    points: readonly (readonly [number, number])[];

    /** Four positive rational weights; create normalizes the outer weights to one. */
    weights: readonly number[];
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
    const own: number = AutoMovieConicArc.curvature(a, b, r);
    if (
      ![a, b, own, shared].every(
        (v: number): boolean => Number.isFinite(v) && v > 0,
      ) ||
      !(r > 0 && r < 1 && shared <= own)
    )
      return "G2 conic end needs finite positive extents/curvatures and shared curvature no greater than own";
    if (shared === own) return null;
    const tau: number = shared / own;
    const contrast: number = (own - shared) / own;
    const scale: number = Math.hypot(a, b);
    const A: number = a / scale;
    const B: number = b / scale;
    const budget: number = (1e-7 * A * B) / (A + B);
    const x: number = Math.sqrt(budget / 4);
    const T: number = (x / (1 + 2 * x)) * contrast;
    const s: number = 1 - T;
    const w: number = r / (1 - r);
    const D: number = s * s + 2 * w * T * s + T * T;
    const firstWeight: number = s + w * T;
    const middle: number = firstWeight / Math.sqrt(D);
    const divisor: number = 1 + 2 * middle;
    const elevated: number = divisor / 3;
    const p: number = (w * D) / (firstWeight * (2 * w * s + T));
    const root: number = Math.cbrt(tau);
    const deficit: number = (a * T * T) / D;
    const height: number = (b * T * (2 * w * s + T)) / D;
    const points: readonly (readonly [number, number])[] = [
      [0, 0],
      [0, (2 * middle * p) / divisor],
      [1 / divisor, (2 * middle * p + 1) / divisor],
      [1, 1],
    ];
    const weights: readonly number[] = [
      1,
      elevated / (root * root),
      elevated / root,
      1,
    ];
    const angle: number = Math.atan2(height, a - deficit);
    if (
      ![T, deficit, height, angle, ...weights].every(
        (v: number): boolean => Number.isFinite(v) && v > 0,
      ) ||
      !points.flat().every(Number.isFinite) ||
      !(
        p > 0 &&
        p < 1 &&
        points[1]![1] > 0 &&
        points[1]![1] < points[2]![1] &&
        points[2]![1] < 1 &&
        points[2]![0] > 0 &&
        points[2]![0] < 1 &&
        deficit < a
      )
    )
      return "G2 conic end has no finite positive native/angular extent or rational weights";
    return {
      extent: a,
      deficit,
      height,
      native: T,
      angle,
      curvature: shared,
      points,
      weights,
    };
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
   * @evidence contracts/common.md#clear-and-simple-design One projective reading owns point, ray residual, tangent and curvature; the unchanged interior conic uses its existing evaluator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No input or output clamp is used. A nonfinite or outside-support query, unbracketed ray or residual beyond the stated roundoff scale remains nonfinite.
   * @evidence contracts/common.md#meaningful-documentation Local angles are radians; the log bracket derives from binary64's finite exponent span and admitted weights. The residual floor scales with logarithmic arithmetic, not an empirical shape allowance.
   * @evidence contracts/performance.md#efficient-algorithms At most64 fixed-size projective point readings, six tangent pairs and four curvature triples; midpoint exhaustion terminates earlier.
   * @evidence contracts/performance.md#reuse-equivalent-work The final normalized homogeneous logs serve point, tangent and curvature without another inverse or curvature solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps only the local scalar bracket and final fixed-size jet.
   */
  export function radius(
    patch: IPatch,
    angle: number,
  ): AutoMoviePolarSector.Jet {
    if (!(Number.isFinite(angle) && angle >= 0 && angle <= patch.angle))
      return [NaN, NaN, NaN];
    if (angle === 0)
      return [
        patch.extent,
        0,
        patch.extent - patch.curvature * patch.extent * patch.extent,
      ];
    if (angle === patch.angle) return endpoint(patch);
    const weightLogs: number[] = patch.weights.map(Math.log);
    if (!weightLogs.every(Number.isFinite)) return [NaN, NaN, NaN];
    const span: number =
      Math.log(Number.MAX_VALUE) -
      Math.log(Number.MIN_VALUE) +
      Math.max(...weightLogs.map(Math.abs));
    let lo: number = -span;
    let hi: number = span;
    const below: IProjective = projective(patch, weightLogs, lo);
    const above: IProjective = projective(patch, weightLogs, hi);
    if (
      !(
        Math.atan2(below.point[1], below.point[0]) <= angle &&
        angle <= Math.atan2(above.point[1], above.point[0])
      )
    )
      return [NaN, NaN, NaN];
    for (let i: number = 0; i < 64; i++) {
      const middle: number = (lo + hi) / 2;
      if (middle === lo || middle === hi) break;
      const reading: IProjective = projective(patch, weightLogs, middle);
      if (Math.atan2(reading.point[1], reading.point[0]) < angle) lo = middle;
      else hi = middle;
    }
    const clock: number = (lo + hi) / 2;
    const reading: IProjective = projective(patch, weightLogs, clock);
    const residual: number = Math.abs(
      Math.atan2(reading.point[1], reading.point[0]) - angle,
    );
    const floor: number =
      128 *
      Number.EPSILON *
      (1 + Math.abs(clock) + Math.max(...weightLogs.map(Math.abs))) *
      patch.angle;
    if (!(Number.isFinite(residual) && residual <= floor))
      return [NaN, NaN, NaN];
    return geometry(patch, reading);
  }

  /** Point and normalized log homogeneous monomials at one projective clock. */
  interface IProjective {
    /** Physical point in the original quarter's chart. */
    point: readonly [number, number];

    /** Four log probabilities, retaining terms below exp's underflow range. */
    logs: readonly number[];
  }

  /** Positive Bernstein monomials in u=t/(1-t); the common (1-t)^3 cancels. */
  function projective(
    patch: IPatch,
    weights: readonly number[],
    clock: number,
  ): IProjective {
    const raw: number[] = weights.map(
      (w: number, i: number): number =>
        w + (i === 1 || i === 2 ? Math.log(3) : 0) + i * clock,
    );
    const normalizer: number = logSum(raw);
    const logs: number[] = raw.map((v: number): number => v - normalizer);
    const pivot: number = raw.indexOf(Math.max(...raw));
    const base: readonly [number, number] = patch.points[pivot]!;
    const value: [number, number] = [base[0], base[1]];
    for (let i: number = 0; i < 4; i++) {
      const probability: number = Math.exp(logs[i]!);
      value[0] += probability * (patch.points[i]![0] - base[0]);
      value[1] += probability * (patch.points[i]![1] - base[1]);
    }
    return {
      point: [patch.extent - patch.deficit * value[0], patch.height * value[1]],
      logs,
    };
  }

  /**
   * Positive pair sums differentiate a rational barycentric mean. For a triple
   * i<j<k, the homogeneous determinant coefficient is
   * (j-i)(k-i)(k-j)*det(Pi,Pj,Pk). The fixed elevated polygon's four positive
   * physical triangle areas are deficit*height times [y1*x2,y1,y1,y1*x2].
   * Keeping these sums logarithmic avoids subtracting parallel large native
   * derivatives or discarding very small geometric curvature.
   */
  function geometry(
    patch: IPatch,
    reading: IProjective,
  ): AutoMoviePolarSector.Jet {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i: number = 0; i < 4; i++)
      for (let j: number = i + 1; j < 4; j++) {
        const coefficient: number =
          reading.logs[i]! + reading.logs[j]! + Math.log(j - i);
        const dx: number = patch.points[j]![0] - patch.points[i]![0];
        const dy: number = patch.points[j]![1] - patch.points[i]![1];
        if (dx > 0) xs.push(coefficient + Math.log(dx));
        if (dy > 0) ys.push(coefficient + Math.log(dy));
      }
    const lx: number = Math.log(patch.deficit) + logSum(xs);
    const ly: number = Math.log(patch.height) + logSum(ys);
    const scale: number = Math.max(lx, ly);
    const speed: number =
      scale + Math.log(Math.hypot(Math.exp(lx - scale), Math.exp(ly - scale)));
    const area: number =
      Math.log(patch.deficit) +
      Math.log(patch.height) +
      Math.log(patch.points[1]![1]);
    const small: number = Math.log(patch.points[2]![0]);
    const determinants: number[] = [];
    for (let missing: number = 0; missing < 4; missing++) {
      const indices: number[] = [0, 1, 2, 3].filter(
        (i: number): boolean => i !== missing,
      );
      const i: number = indices[0]!;
      const j: number = indices[1]!;
      const k: number = indices[2]!;
      determinants.push(
        reading.logs[i]! +
          reading.logs[j]! +
          reading.logs[k]! +
          Math.log((j - i) * (k - i) * (k - j)) +
          area +
          (missing === 0 || missing === 3 ? small : 0),
      );
    }
    return polarGeometry(
      reading.point,
      lx,
      ly,
      logSum(determinants) - 3 * speed,
    );
  }

  /** Finite endpoint geometry uses the same polygon and rational endpoint law. */
  function endpoint(patch: IPatch): AutoMoviePolarSector.Jet {
    const point: readonly [number, number] = [
      patch.extent - patch.deficit,
      patch.height,
    ];
    const lx: number =
      Math.log(patch.deficit) + Math.log(1 - patch.points[2]![0]);
    const ly: number =
      Math.log(patch.height) + Math.log(1 - patch.points[2]![1]);
    const scale: number = Math.max(lx, ly);
    const edge: number =
      scale + Math.log(Math.hypot(Math.exp(lx - scale), Math.exp(ly - scale)));
    const curvature: number =
      Math.log(2 / 3) +
      Math.log(patch.weights[3]!) +
      Math.log(patch.weights[1]!) -
      2 * Math.log(patch.weights[2]!) +
      Math.log(patch.deficit) +
      Math.log(patch.height) +
      Math.log(patch.points[1]![1]) +
      Math.log(patch.points[2]![0]) -
      3 * edge;
    return polarGeometry(point, lx, ly, curvature);
  }

  /** Polar slope and second derivative from tangent direction and geometric curvature. */
  function polarGeometry(
    point: readonly [number, number],
    lx: number,
    ly: number,
    curvature: number,
  ): AutoMoviePolarSector.Jet {
    const scale: number = Math.max(lx, ly);
    const tx: number = -Math.exp(lx - scale);
    const ty: number = Math.exp(ly - scale);
    const rho: number = Math.hypot(...point);
    const dot: number = (point[0] / rho) * tx + (point[1] / rho) * ty;
    const cross: number = (point[0] / rho) * ty - (point[1] / rho) * tx;
    if (!(Number.isFinite(cross) && cross > 0)) return [NaN, NaN, NaN];
    const ratio: number = dot / cross;
    return [
      rho,
      rho * ratio,
      rho *
        (1 +
          2 * ratio * ratio -
          Math.exp(curvature + Math.log(rho)) * (1 + ratio * ratio) ** 1.5),
    ];
  }

  /** Logarithm of a positive sum, with an empty sum represented by -Infinity. */
  function logSum(values: readonly number[]): number {
    if (values.length === 0) return -Infinity;
    const largest: number = Math.max(...values);
    let total: number = 0;
    for (const value of values) total += Math.exp(value - largest);
    return largest + Math.log(total);
  }
}
