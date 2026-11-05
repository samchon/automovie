import type { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import type { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/** Scalar operation contract; no implementation table is retained. */
type Algebra<T> = AutoMovieConicFieldJet.IAlgebra<T>;

/** Actual source Hessian tuple. */
type Jet = AutoMovieConicFieldJet.IJet;

/**
 * Shared projective G2 geometry at an already selected numeric clock.
 *
 * @evidence contracts/common.md#principled-implementation Normalized homogeneous log monomials and positive pair sums serve both NUMBER and AD.
 * @evidence contracts/common.md#clear-and-simple-design Existing Hermite owns preparation and the numeric inverse; this kernel owns point/direction arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No AD allocation occurs in a numeric inverse and no second ray solve occurs in a source read.
 * @evidence contracts/common.md#meaningful-documentation Clock is cubic log odds; endpoints are explicit positions, not null-clock guesses.
 * @evidence contracts/performance.md#efficient-algorithms Fixed four monomials and six positive tangent pairs per reading.
 * @evidence contracts/performance.md#reuse-equivalent-work Numeric and differentiated readers specialize the identical projective formula.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Prepared tuples and fresh results are call-owned; no cache or algebra table is retained.
 */
export namespace AutoMovieConicHermiteField {
  /**
   * Point and normalized homogeneous log probabilities at one clock.
   *
   * @evidence contracts/common.md#principled-implementation The projective Bernstein mean preserves the original positive rational polygon.
   * @evidence contracts/common.md#clear-and-simple-design One intermediate serves point and tangent evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An endpoint has an explicit point and no invented finite clock.
   * @evidence contracts/common.md#meaningful-documentation Point uses physical quarter coordinates; logs are dimensionless log probabilities.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its final logs are reused by the tangent and numeric curvature readers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns two coordinates and at most four logs.
   */
  export interface IProjective<T> {
    /** Physical point in the selected end chart. */
    point: readonly [T, T];

    /** Four log probabilities for an interior clock; empty at an explicit endpoint. */
    logs: readonly T[];
  }

  /**
   * Increasing-polar unit tangent and logarithmic speed scale.
   *
   * @evidence contracts/common.md#principled-implementation Positive pair sums avoid subtraction of parallel native derivatives.
   * @evidence contracts/common.md#clear-and-simple-design The numeric curvature owner and source reader share one direction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the first source derivatives of the unit tangent are externally required.
   * @evidence contracts/common.md#meaningful-documentation Interior speed uses log-odds clock; endpoint speed uses its polygon edge scale.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This data record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same normalized pair determines tangent and log speed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Two tangent coordinates and one log scale belong to the caller.
   */
  export interface IDirection<T> {
    /** Increasing-polar unit tangent in the selected end chart. */
    tangent: readonly [T, T];

    /** Logarithm of physical positive speed or endpoint edge length. */
    logSpeed: T;
  }

  /**
   * Stable logarithm of a positive sum with a primal scaling gauge.
   *
   * @evidence contracts/common.md#principled-implementation The maximum is frozen only as a gauge; exp sum and logarithm remain differentiated.
   * @evidence contracts/common.md#clear-and-simple-design One kernel serves normalized weights and positive velocity sums.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source logarithmic derivative is frozen to a number.
   * @evidence contracts/common.md#meaningful-documentation The empty sum is log(0); regular readers require a nonempty positive component or an explicit endpoint.
   * @evidence contracts/performance.md#efficient-algorithms One bounded traversal of the supplied fixed-size array.
   * @evidence contracts/performance.md#reuse-equivalent-work One maximum normalizes every term.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar without retaining its array.
   */
  export function logSum<T>(ops: Algebra<T>, values: readonly T[]): T {
    if (values.length === 0) return ops.constant(-Infinity);
    const largest: number = Math.max(
      ...values.map((value: T): number => ops.value(value)),
    );
    const gauge: T = ops.constant(largest);
    let sum: T = ops.constant(0);
    for (const value of values)
      sum = ops.add(sum, ops.exp(ops.subtract(value, gauge)));
    return ops.add(gauge, ops.log(sum));
  }

  /**
   * Rational cubic point at a fixed log-odds clock or an explicit endpoint.
   *
   * @evidence contracts/common.md#principled-implementation Homogeneous monomials are normalized logarithmically, then a pivoted barycentric mean preserves small coordinate differences.
   * @evidence contracts/common.md#clear-and-simple-design One operation kernel supplies both numeric ray inversion and source point Hessians.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint identity is never inferred from a rounded native t or null clock.
   * @evidence contracts/common.md#meaningful-documentation Interior clock is constant with respect to s,p; endpoint points follow their prepared source controls.
   * @evidence contracts/performance.md#efficient-algorithms Four monomials and fixed-size barycentric sums.
   * @evidence contracts/performance.md#reuse-equivalent-work The resulting normalized logs serve the final direction and numeric curvature.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a point and at most four log scalars escape.
   */
  export function projective<T>(
    ops: Algebra<T>,
    patch: AutoMovieConicHermite.IPatch<T>,
    weights: readonly T[],
    clock: number | null,
    position: "first" | "interior" | "last" = "interior",
  ): IProjective<T> {
    if (position === "first")
      return { point: [patch.extent, ops.constant(0)], logs: [] };
    if (position === "last")
      return {
        point: [ops.subtract(patch.extent, patch.deficit), patch.height],
        logs: [],
      };
    if (clock === null)
      return { point: [ops.constant(NaN), ops.constant(NaN)], logs: [] };
    const raw: T[] = weights.map(
      (weight: T, i: number): T =>
        ops.add(
          weight,
          ops.constant((i === 1 || i === 2 ? Math.log(3) : 0) + i * clock),
        ),
    );
    const normalizer: T = logSum(ops, raw);
    const logs: T[] = raw.map((value: T): T => ops.subtract(value, normalizer));
    const maximum: number = Math.max(
      ...raw.map((value: T): number => ops.value(value)),
    );
    const pivot: number = raw.findIndex(
      (value: T): boolean => ops.value(value) === maximum,
    );
    const base: readonly [T, T] = patch.points[pivot]!;
    let x: T = base[0];
    let y: T = base[1];
    for (let i: number = 0; i < 4; i++) {
      const probability: T = ops.exp(logs[i]!);
      x = ops.add(
        x,
        ops.multiply(probability, ops.subtract(patch.points[i]![0], base[0])),
      );
      y = ops.add(
        y,
        ops.multiply(probability, ops.subtract(patch.points[i]![1], base[1])),
      );
    }
    return {
      point: [
        ops.subtract(patch.extent, ops.multiply(patch.deficit, x)),
        ops.multiply(patch.height, y),
      ],
      logs,
    };
  }

  /**
   * Unit tangent from positive projective pair sums.
   *
   * @evidence contracts/common.md#principled-implementation Pairs have coefficient (j-i)*probability_i*probability_j; physical deficit and height restore the Cartesian direction.
   * @evidence contracts/common.md#clear-and-simple-design One direction formula serves numeric curvature and source tangent gradients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No native speed division or world-coordinate control subtraction is used.
   * @evidence contracts/common.md#meaningful-documentation Endpoint direction reads its exact polygon edge; increasing local polar direction is[-x,+y].
   * @evidence contracts/performance.md#efficient-algorithms Six pairs and constant-size logarithmic normalization.
   * @evidence contracts/performance.md#reuse-equivalent-work The final projective probabilities are reused without another inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a tangent pair and one logarithmic scale escape.
   */
  export function direction<T>(
    ops: Algebra<T>,
    patch: AutoMovieConicHermite.IPatch<T>,
    reading: IProjective<T>,
    position: "first" | "interior" | "last",
  ): IDirection<T> {
    if (position !== "interior") {
      const first: readonly [T, T] =
        position === "first" ? patch.points[0]! : patch.points[2]!;
      const last: readonly [T, T] =
        position === "first" ? patch.points[1]! : patch.points[3]!;
      const x: T = ops.multiply(patch.deficit, ops.subtract(last[0], first[0]));
      const y: T = ops.multiply(patch.height, ops.subtract(last[1], first[1]));
      const edge: T = AutoMovieConicArcField.norm(ops, x, y);
      return {
        tangent:
          position === "first"
            ? [ops.constant(0), ops.constant(1)]
            : [
                ops.divide(ops.subtract(ops.constant(0), x), edge),
                ops.divide(y, edge),
              ],
        logSpeed: ops.log(edge),
      };
    }
    const xs: T[] = [];
    const ys: T[] = [];
    for (let i: number = 0; i < 4; i++)
      for (let j: number = i + 1; j < 4; j++) {
        const coefficient: T = ops.add(
          ops.add(reading.logs[i]!, reading.logs[j]!),
          ops.constant(Math.log(j - i)),
        );
        const dx: T = ops.subtract(patch.points[j]![0], patch.points[i]![0]);
        const dy: T = ops.subtract(patch.points[j]![1], patch.points[i]![1]);
        if (ops.value(dx) > 0) xs.push(ops.add(coefficient, ops.log(dx)));
        if (ops.value(dy) > 0) ys.push(ops.add(coefficient, ops.log(dy)));
      }
    const lx: T = ops.add(ops.log(patch.deficit), logSum(ops, xs));
    const ly: T = ops.add(ops.log(patch.height), logSum(ops, ys));
    const gauge: T = ops.constant(Math.max(ops.value(lx), ops.value(ly)));
    const x: T = ops.exp(ops.subtract(lx, gauge));
    const y: T = ops.exp(ops.subtract(ly, gauge));
    const speed: T = AutoMovieConicArcField.norm(ops, x, y);
    return {
      tangent: [
        ops.divide(ops.subtract(ops.constant(0), x), speed),
        ops.divide(y, speed),
      ],
      logSpeed: ops.add(gauge, ops.log(speed)),
    };
  }

  /**
   * Prepared G2 source partials at the final primal clock.
   *
   * @evidence contracts/common.md#principled-implementation The same projective point and positive direction kernel reads supplied source Hessians.
   * @evidence contracts/common.md#clear-and-simple-design One selected descriptor supplies clock, endpoint identity, reflection and radial phase geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No inverse, native-turn partition, length integration or missing derivative is added.
   * @evidence contracts/common.md#meaningful-documentation Returns point2/tangent1 in the original quarter chart; reflected tangent changes by -S.
   * @evidence contracts/performance.md#efficient-algorithms One AD reading outside the numeric inverse's iterations.
   * @evidence contracts/performance.md#reuse-equivalent-work The numeric radial jet and log curvature are reused unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh required tuples or one named failure retain no preparation or cache.
   */
  export function read(
    patch: AutoMovieConicHermite.IPatch<Jet>,
    ray: AutoMovieConicArc.IRay,
  ): AutoMovieConicArcField.IReading | AutoMovieConicArcField.IFailure {
    if (
      ray.position === "interior" &&
      (ray.clock === null || !Number.isFinite(ray.clock))
    )
      return {
        kind: "failure",
        detail:
          "A G2 source reading requires the selected finite interior log-odds clock.",
      };

    const ops: Algebra<Jet> = AutoMovieConicFieldJet.AD;
    const weights: Jet[] = patch.weights.map(
      (weight: Jet): Jet => ops.log(weight),
    );
    const reading: IProjective<Jet> = projective(
      ops,
      patch,
      weights,
      ray.clock,
      ray.position,
    );
    const tangent: IDirection<Jet> = direction(
      ops,
      patch,
      reading,
      ray.position,
    );
    return AutoMovieConicArcField.finish(
      AutoMovieConicArcField.orient(
        ops,
        { point: reading.point, tangent: tangent.tangent },
        ray.reverse,
      ),
      ray,
    );
  }

  /**
   * Numeric phase geometry from the final shared projective reading.
   *
   * @evidence contracts/common.md#principled-implementation Positive homogeneous triple determinants and exact endpoint laws provide logarithmic curvature; the unit tangent determines the polar jet.
   * @evidence contracts/common.md#clear-and-simple-design One primal geometry owner serves the numeric source and fixed-clock derivative descriptor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Curvature is never obtained by subtracting nearly parallel native derivatives.
   * @evidence contracts/common.md#meaningful-documentation Endpoint speed is its polygon edge scale; interior speed is log-odds speed; no source curvature derivatives are implied.
   * @evidence contracts/performance.md#efficient-algorithms Four positive triples or one endpoint identity, with fixed storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the final projective probabilities and shared direction without another inverse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed-size numeric descriptor arrays escape.
   */
  export function ray(
    patch: AutoMovieConicHermite.IPatch,
    reading: IProjective<number>,
    clock: number | null,
    position: "first" | "interior" | "last",
  ): AutoMovieConicArc.IRay | null {
    const directionValue: IDirection<number> = direction(
      AutoMovieConicFieldJet.NUMBER,
      patch,
      reading,
      position,
    );
    let logCurvature: number;
    if (position === "first") logCurvature = Math.log(patch.curvature);
    else if (position === "last")
      logCurvature =
        Math.log(2 / 3) +
        Math.log(patch.weights[3]!) +
        Math.log(patch.weights[1]!) -
        2 * Math.log(patch.weights[2]!) +
        Math.log(patch.deficit) +
        Math.log(patch.height) +
        Math.log(patch.points[1]![1]) +
        Math.log(patch.points[2]![0]) -
        3 * directionValue.logSpeed;
    else {
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
      logCurvature =
        logSum(AutoMovieConicFieldJet.NUMBER, determinants) -
        3 * directionValue.logSpeed;
    }
    const radial: AutoMoviePolarSector.Jet =
      position === "first"
        ? [
            patch.extent,
            0,
            patch.extent - patch.curvature * patch.extent * patch.extent,
          ]
        : polarGeometry(reading.point, directionValue.tangent, logCurvature);
    if (
      ![
        ...reading.point,
        ...directionValue.tangent,
        ...radial,
        logCurvature,
      ].every(Number.isFinite)
    )
      return null;

    return {
      point: reading.point,
      tangent: directionValue.tangent,
      radial,
      logCurvature,
      native: null,
      clock,
      position,
      reverse: false,
    };
  }

  /** Polar slope and second derivative from unit direction and logarithmic geometric curvature. */
  function polarGeometry(
    point: readonly [number, number],
    tangent: readonly [number, number],
    curvature: number,
  ): AutoMoviePolarSector.Jet {
    const rho: number = Math.hypot(...point);
    const dot: number =
      (point[0] / rho) * tangent[0] + (point[1] / rho) * tangent[1];
    const cross: number =
      (point[0] / rho) * tangent[1] - (point[1] / rho) * tangent[0];
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
}
