import type { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/** Scalar operation contract shared with the numeric source. */
type Algebra<T> = AutoMovieConicFieldJet.IAlgebra<T>;

/** Actual source partials [value,s,p,ss,sp,pp]. */
type Jet = AutoMovieConicFieldJet.IJet;

/** Invocation-local normalized positive Bernstein terms, before velocity work. */
interface Basis<T> {
  /** Normalized first extent. */ a: T;
  /** Normalized second extent. */ b: T;
  /** Frozen primal scaling gauge. */ gauge: T;
  /** First coordinate numerator basis. */ left: T;
  /** Second coordinate numerator basis. */ right: T;
  /** Shared positive rational denominator. */ denominator: T;
}

/**
 * Shared rational-quadratic algebra and fixed-clock source readings.
 *
 * @evidence contracts/common.md#principled-implementation One positive Bernstein point and velocity formula serves NUMBER and AD; reflection preserves increasing polar orientation.
 * @evidence contracts/common.md#clear-and-simple-design Numeric source adapters and source-jet readers use one operation kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native-clock finite differences, source reinterpolation or source cache is present.
 * @evidence contracts/common.md#meaningful-documentation Source coordinates are s,p; angular derivatives remain the supplied primal ray reading.
 * @evidence contracts/performance.md#efficient-algorithms Constant-size arithmetic reads an already selected native clock; the Point0 capability omits velocity and tangent work.
 * @evidence contracts/performance.md#reuse-equivalent-work Every component of the source reading shares that one native evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only invocation-owned fixed-size tuples escape; operation tables and sources are not retained.
 */
export namespace AutoMovieConicArcField {
  /**
   * Cartesian point and increasing-polar unit tangent in one quarter chart.
   *
   * @evidence contracts/common.md#principled-implementation The normalized positive native velocity fixes orientation independently of its speed.
   * @evidence contracts/common.md#clear-and-simple-design Two pairs separate position from unit direction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Higher source tangent partials are internal algebra outputs, not required physical derivatives.
   * @evidence contracts/common.md#meaningful-documentation Point uses source length units; tangent is dimensionless.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This generic data record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its evaluator owns arithmetic reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The evaluation caller owns its two fixed pairs.
   */
  export interface IGeometry<T> {
    /** Cartesian point, in the selected quarter chart. */
    point: readonly [T, T];

    /** Unit tangent in increasing original polar direction. */
    tangent: readonly [T, T];
  }

  /**
   * Required fixed-clock source jets, paired with the same primal ray geometry.
   *
   * @evidence contracts/common.md#principled-implementation Only point source order two and unit-tangent source order one feed the geometric radial lift.
   * @evidence contracts/common.md#clear-and-simple-design One reading exposes the exact derivative orders its consumer needs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Tangent Hessians are neither fabricated as zero nor required finite.
   * @evidence contracts/common.md#meaningful-documentation Point entries use [value,s,p,ss,sp,pp]; tangent entries use [value,s,p]; radial uses [rho,rho_phi,rho_phiphi].
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The selected primal clock is supplied by the numeric owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh tuples belong to the caller; no source, algebra or cache is retained.
   */
  export interface IReading {
    /** Successful source reading discriminator. */
    kind: "reading";

    /** Two Cartesian source Hessians in source length units. */
    point: readonly [Jet, Jet];

    /** Two unit-tangent source gradients. */
    tangent: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
    ];

    /** Existing numeric radial phase jet. */
    radial: AutoMoviePolarSector.Jet;

    /** Natural logarithm of positive geometric curvature, inverse length. */
    logCurvature: number;
  }

  /**
   * Named source-reading failure, never a replacement derivative.
   *
   * @evidence contracts/common.md#principled-implementation A failed finite-input or required-output premise remains explicit.
   * @evidence contracts/common.md#clear-and-simple-design One discriminator and detail identify failure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing derivatives are never silently zeroed or sent to a legacy shape.
   * @evidence contracts/common.md#meaningful-documentation Detail names the failed fixed-clock source premise.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This diagnostic record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The field caller owns admission sequencing.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one diagnostic string survives.
   */
  export interface IFailure {
    /** Failed source-reading discriminator. */
    kind: "failure";

    /** Original failed numerical premise. */
    detail: string;
  }

  /**
   * The original dimensionless shoulder-to-weight map.
   *
   * @evidence contracts/common.md#principled-implementation Uses w=r/(1-r) in both scalar representations.
   * @evidence contracts/common.md#clear-and-simple-design One operation formula owns the weight map.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounding to an ellipse or shoulder clamp occurs.
   * @evidence contracts/common.md#meaningful-documentation The caller admits r inside (0,1).
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Both numeric and differentiated preparations call this formula.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar without retained data.
   */
  export function weight<T>(ops: Algebra<T>, r: T): T {
    return ops.divide(r, ops.subtract(ops.constant(1), r));
  }

  /**
   * Original endpoint geometric curvature, inverse source length.
   *
   * @evidence contracts/common.md#principled-implementation Uses a/(2*w*w*b*b) with the same multiplication order in NUMBER and AD.
   * @evidence contracts/common.md#clear-and-simple-design The numeric public curvature delegates to this formula.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled curvature or branch-specific substitute is introduced.
   * @evidence contracts/common.md#meaningful-documentation Inputs are positive extents and an admitted shoulder.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Weight conversion is shared with point and preparation readers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar without retained data.
   */
  export function curvature<T>(ops: Algebra<T>, a: T, b: T, r: T): T {
    const w: T = weight(ops, r);
    const divisor: T = ops.multiply(
      ops.multiply(ops.multiply(ops.multiply(ops.constant(2), w), w), b),
      b,
    );
    return ops.divide(a, divisor);
  }

  /**
   * Regular Euclidean norm with a frozen numerical scaling gauge.
   *
   * @evidence contracts/common.md#principled-implementation Only max of primal magnitudes is frozen; the normalized norm remains differentiated.
   * @evidence contracts/common.md#clear-and-simple-design One norm kernel serves shared point and tangent algebra.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The norm itself is not replaced by its primal value; zero or nonfinite regularity remains nonfinite.
   * @evidence contracts/common.md#meaningful-documentation Requires a representable positive norm; no derivative at the singular origin is promised.
   * @evidence contracts/performance.md#efficient-algorithms Constant operations independent of source history.
   * @evidence contracts/performance.md#reuse-equivalent-work The scaled pair shares its one gauge.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar and retains neither input.
   */
  export function norm<T>(ops: Algebra<T>, a: T, b: T): T {
    const scale: number = Math.max(
      Math.abs(ops.value(a)),
      Math.abs(ops.value(b)),
    );
    const gauge: T = ops.constant(scale);
    const x: T = ops.divide(a, gauge);
    const y: T = ops.divide(b, gauge);
    return ops.multiply(
      gauge,
      ops.sqrt(ops.add(ops.multiply(x, x), ops.multiply(y, y))),
    );
  }

  /**
   * Positive magnitudes of the quadratic's native velocity.
   *
   * @evidence contracts/common.md#principled-implementation Differentiating the rational Bernstein point gives 2*a*t*(s+w*t)/D^2 and 2*b*s*(t+w*s)/D^2.
   * @evidence contracts/common.md#clear-and-simple-design One velocity serves numeric arclength and source unit tangents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No point differences or polar singular speed are used.
   * @evidence contracts/common.md#meaningful-documentation The first magnitude has negative Cartesian sign; t may carry source derivatives for a moving-boundary question.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic.
   * @evidence contracts/performance.md#reuse-equivalent-work Both components share s,w and denominator.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two invocation-owned scalars.
   */
  export function velocity<T>(
    ops: Algebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): readonly [T, T] {
    const s: T = ops.subtract(ops.constant(1), t);
    const middle: T = ops.multiply(
      ops.multiply(ops.multiply(ops.constant(2), w), t),
      s,
    );
    const denominator: T = ops.add(
      ops.add(ops.multiply(s, s), middle),
      ops.multiply(t, t),
    );
    return [
      ops.divide(
        ops.divide(
          ops.multiply(
            ops.multiply(ops.multiply(ops.constant(2), a), t),
            ops.add(s, ops.multiply(w, t)),
          ),
          denominator,
        ),
        denominator,
      ),
      ops.divide(
        ops.divide(
          ops.multiply(
            ops.multiply(ops.multiply(ops.constant(2), b), s),
            ops.add(t, ops.multiply(w, s)),
          ),
          denominator,
        ),
        denominator,
      ),
    ];
  }

  /**
   * Original rational point and unit tangent at an algebra-valued native parameter.
   *
   * @evidence contracts/common.md#principled-implementation The positive quadratic and velocity are evaluated in normalized extent coordinates, then physical position is restored.
   * @evidence contracts/common.md#clear-and-simple-design One kernel supplies NUMBER and AD point/direction values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No stationary native clock division or reinterpolated scalar source is introduced.
   * @evidence contracts/common.md#meaningful-documentation An algebra-valued t permits independent alignment with a moving G2 far boundary; production passes a constant selected native t.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic outside the numeric ray inverse.
   * @evidence contracts/performance.md#reuse-equivalent-work Position and tangent share the same extents, weight and native parameter.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two fixed pairs without retaining sources.
   */
  export function evaluate<T>(
    ops: Algebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): IGeometry<T> {
    const basis: Basis<T> = pointBasis(ops, a, b, w, t);
    const speed: readonly [T, T] = velocity(ops, basis.a, basis.b, w, t);
    const length: T = norm(ops, speed[0], speed[1]);
    return {
      point: restorePoint(ops, basis),
      tangent: [
        ops.divide(ops.subtract(ops.constant(0), speed[0]), length),
        ops.divide(speed[1], length),
      ],
    };
  }

  /**
   * Original Cartesian point without preparing velocity or a unit tangent.
   *
   * @evidence contracts/common.md#principled-implementation Uses the identical normalized Bernstein terms and physical restoration as evaluate in either scalar algebra.
   * @evidence contracts/common.md#clear-and-simple-design The point capability shares two private arithmetic kernels with the full geometry reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No radius/trigonometric reconstruction, endpoint substitution or invented derivative is returned.
   * @evidence contracts/common.md#meaningful-documentation Coordinates use source length units; the supplied native parameter may carry source derivatives.
   * @evidence contracts/performance.md#efficient-algorithms Constant point arithmetic omits the velocity, norm and tangent divisions.
   * @evidence contracts/performance.md#reuse-equivalent-work One normalized basis supplies both coordinates; full evaluate preserves its original algebra-call order.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One fixed local basis and a fresh coordinate pair are call-owned; nothing is cached.
   */
  export function point<T>(
    ops: Algebra<T>,
    a: T,
    b: T,
    w: T,
    t: T,
  ): readonly [T, T] {
    return restorePoint(ops, pointBasis(ops, a, b, w, t));
  }

  /** Preserve the original pre-velocity operation order and normalization. */
  function pointBasis<T>(ops: Algebra<T>, a: T, b: T, w: T, t: T): Basis<T> {
    const scale: number = Math.max(
      Math.abs(ops.value(a)),
      Math.abs(ops.value(b)),
    );
    const gauge: T = ops.constant(scale);
    const A: T = ops.divide(a, gauge);
    const B: T = ops.divide(b, gauge);
    const s: T = ops.subtract(ops.constant(1), t);
    const middle: T = ops.multiply(
      ops.multiply(ops.multiply(ops.constant(2), w), t),
      s,
    );
    const left: T = ops.add(ops.multiply(s, s), middle);
    const right: T = ops.add(middle, ops.multiply(t, t));
    const denominator: T = ops.add(left, ops.multiply(t, t));
    return { a: A, b: B, gauge, left, right, denominator };
  }

  /** The same final point operations occur after velocity work in evaluate. */
  function restorePoint<T>(ops: Algebra<T>, basis: Basis<T>): readonly [T, T] {
    return [
      ops.multiply(
        ops.divide(ops.multiply(basis.a, basis.left), basis.denominator),
        basis.gauge,
      ),
      ops.multiply(
        ops.divide(ops.multiply(basis.b, basis.right), basis.denominator),
        basis.gauge,
      ),
    ];
  }

  /**
   * Reflect a selected end back to its original quarter chart.
   *
   * @evidence contracts/common.md#principled-implementation Reflection S swaps point coordinates and sends increasing-polar T to -S*T.
   * @evidence contracts/common.md#clear-and-simple-design The same operation acts on numeric and source derivatives.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No second reflection or selective mixed-derivative sign change is hidden.
   * @evidence contracts/common.md#meaningful-documentation The boolean records the existing primal branch, not a differentiated authoring coordinate.
   * @evidence contracts/performance.md#efficient-algorithms Constant pair operations.
   * @evidence contracts/performance.md#reuse-equivalent-work Position and tangent use one reflection decision.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed pairs and retains no branch state.
   */
  export function orient<T>(
    ops: Algebra<T>,
    geometry: IGeometry<T>,
    reverse: boolean,
  ): IGeometry<T> {
    if (!reverse) return geometry;
    return {
      point: [geometry.point[1], geometry.point[0]],
      tangent: [
        ops.subtract(ops.constant(0), geometry.tangent[1]),
        ops.subtract(ops.constant(0), geometry.tangent[0]),
      ],
    };
  }

  /**
   * Admit and copy exactly the required source derivative orders.
   *
   * @evidence contracts/common.md#principled-implementation Checks point Hessians, tangent gradients and the supplied primal radial geometry.
   * @evidence contracts/common.md#clear-and-simple-design The raw and G2 readers share one required-output admission boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused tangent Hessians are not tested or fabricated.
   * @evidence contracts/common.md#meaningful-documentation The caller has already restored the original quarter chart and increasing-polar orientation.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-size finite checks and tuple copies.
   * @evidence contracts/performance.md#reuse-equivalent-work The supplied primal ray is reused without another inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh output tuples retain no prepared source or operation table.
   */
  export function finish(
    geometry: IGeometry<Jet>,
    ray: AutoMovieConicArc.IRay,
  ): IReading | IFailure {
    const required: number[] = [
      ...geometry.point[0],
      ...geometry.point[1],
      ...geometry.tangent[0].slice(0, 3),
      ...geometry.tangent[1].slice(0, 3),
      ...ray.radial,
      ray.logCurvature,
    ];
    if (!required.every(Number.isFinite))
      return {
        kind: "failure",
        detail:
          "The selected conic has no finite required point2/tangent1 source reading.",
      };

    return {
      kind: "reading",
      point: [[...geometry.point[0]], [...geometry.point[1]]],
      tangent: [
        [
          geometry.tangent[0][0],
          geometry.tangent[0][1],
          geometry.tangent[0][2],
        ],
        [
          geometry.tangent[1][0],
          geometry.tangent[1][1],
          geometry.tangent[1][2],
        ],
      ],
      radial: [...ray.radial],
      logCurvature: ray.logCurvature,
    };
  }

  /**
   * Read quadratic source partials only at the already selected numeric clock.
   *
   * @evidence contracts/common.md#principled-implementation Original extent/shoulder Hessians feed the shared rational kernel; the chosen native clock is constant.
   * @evidence contracts/common.md#clear-and-simple-design One raw-source read returns point2 and tangent1 for geometric lifting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No ray inversion, source sampling or missing derivative replacement occurs.
   * @evidence contracts/common.md#meaningful-documentation The descriptor's reflection restores the original quarter before admission.
   * @evidence contracts/performance.md#efficient-algorithms One fixed-size AD evaluation, outside every numeric bisection.
   * @evidence contracts/performance.md#reuse-equivalent-work The primal descriptor supplies radial phase jets and log curvature.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh tuples or a named failure without caching.
   */
  export function read(
    extents: readonly [Jet, Jet],
    shoulder: Jet,
    ray: AutoMovieConicArc.IRay,
  ): IReading | IFailure {
    if (
      ray.native === null ||
      !Number.isFinite(ray.native) ||
      !(
        extents[0][0] > 0 &&
        extents[1][0] > 0 &&
        shoulder[0] > 0 &&
        shoulder[0] < 1
      ) ||
      ![...extents[0], ...extents[1], ...shoulder].every(Number.isFinite)
    )
      return {
        kind: "failure",
        detail:
          "Raw conic reading requires finite supplied source jets and a selected native clock.",
      };

    const ops: Algebra<Jet> = AutoMovieConicFieldJet.AD;
    const a: Jet = extents[ray.reverse ? 1 : 0];
    const b: Jet = extents[ray.reverse ? 0 : 1];
    const geometry: IGeometry<Jet> = evaluate(
      ops,
      a,
      b,
      weight(ops, shoulder),
      ops.constant(ray.native),
    );
    return finish(orient(ops, geometry, ray.reverse), ray);
  }
}
