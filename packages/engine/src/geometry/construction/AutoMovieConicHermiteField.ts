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
 * @evidence contracts/development/common.md#meaningful-documentation Clock is cubic log odds; endpoints are explicit positions, not null-clock guesses.
 * @evidence contracts/development/design.md#principled-representation Represents Shared projective G2 geometry at an already selected numeric clock: companion namespace of 9 members (`IProjective`, `IDirection`, `logSum`, `sumAtMaximum`, `projective`, `direction`, ...); units and frames named in its text: rational, world, local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConicHermiteField` in packages/engine/src/geometry/construction/AutoMovieConicHermiteField.ts; its surface is the 9 members listed and the text shows 4 other files naming it, mostly packages/engine (2), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConicHermiteField {
  /**
   * Point and normalized homogeneous log probabilities at one clock.
   *
   * @evidence contracts/development/design.md#principled-representation The projective Bernstein mean preserves the original positive rational polygon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One intermediate serves point and tangent evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An endpoint has an explicit point and no invented finite clock.
   * @evidence contracts/development/common.md#meaningful-documentation Point uses physical quarter coordinates; logs are dimensionless log probabilities.
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
   * @evidence contracts/development/design.md#principled-representation Positive pair sums avoid subtraction of parallel native derivatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The numeric curvature owner and source reader share one direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the first source derivatives of the unit tangent are externally required.
   * @evidence contracts/development/common.md#meaningful-documentation Interior speed uses log-odds clock; endpoint speed uses its polygon edge scale.
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
   * @evidence contracts/development/implementation.md#principled-implementation The maximum is frozen only as a gauge; exp sum and logarithm remain differentiated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kernel serves normalized weights and positive velocity sums.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source logarithmic derivative is frozen to a number.
   * @evidence contracts/development/common.md#meaningful-documentation The empty sum is log(0); regular readers require a nonempty positive component or an explicit endpoint.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded traversal of the supplied fixed-size array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One maximum normalizes every term.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar without retaining its array.
   */
  export function logSum<T>(ops: Algebra<T>, values: readonly T[]): T {
    if (values.length === 0) return ops.constant(-Infinity);
    const largest: number = Math.max(
      ...values.map((value: T): number => ops.value(value)),
    );
    return sumAtMaximum(ops, values, largest);
  }

  /** Preserve the ordered log-sum arithmetic while reusing an already read primal gauge. */
  function sumAtMaximum<T>(
    ops: Algebra<T>,
    values: readonly T[],
    largest: number,
  ): T {
    const gauge: T = ops.constant(largest);
    let sum: T = ops.constant(0);
    for (const value of values)
      sum = ops.add(sum, ops.exp(ops.subtract(value, gauge)));
    return ops.add(gauge, ops.log(sum));
  }

  /**
   * Rational cubic point at a fixed log-odds clock or an explicit endpoint.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Homogeneous monomials are normalized logarithmically, then a pivoted barycentric mean preserves small coordinate differences.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation kernel supplies both numeric ray inversion and source point Hessians.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Endpoint identity is never inferred from a rounded native t or null clock.
   * @evidence contracts/development/common.md#meaningful-documentation Interior clock is constant with respect to s,p; endpoint points follow their prepared source controls.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four monomials and fixed-size barycentric sums.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One primal maximum supplies the normalization gauge and pivot; normalized logs serve the final direction and numeric curvature.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a point and at most four log scalars escape.
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
    const primals: number[] = raw.map((value: T): number => ops.value(value));
    const maximum: number = Math.max(...primals);
    const pivot: number = primals.indexOf(maximum);
    const normalizer: T = sumAtMaximum(ops, raw, maximum);
    const logs: T[] = raw.map((value: T): T => ops.subtract(value, normalizer));
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
   * @evidence contracts/development/implementation.md#principled-implementation Pairs have coefficient (j-i)*probability_i*probability_j; physical deficit and height restore the Cartesian direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direction formula serves numeric curvature and source tangent gradients.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No native speed division or world-coordinate control subtraction is used.
   * @evidence contracts/development/common.md#meaningful-documentation Endpoint direction reads its exact polygon edge; increasing local polar direction is[-x,+y].
   * @evidence contracts/development/implementation.md#efficient-algorithms Six pairs and constant-size logarithmic normalization.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The final projective probabilities are reused without another inverse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a tangent pair and one logarithmic scale escape.
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
   * @evidence contracts/development/implementation.md#principled-implementation The same projective point and positive direction kernel reads supplied source Hessians.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One selected descriptor supplies clock, endpoint identity, reflection and radial phase geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No inverse, native-turn partition, length integration or missing derivative is added.
   * @evidence contracts/development/common.md#meaningful-documentation Returns point2/tangent1 in the original quarter chart; reflected tangent changes by -S.
   * @evidence contracts/development/implementation.md#efficient-algorithms One AD reading outside the numeric inverse's iterations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The numeric radial jet and log curvature are reused unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh required tuples or one named failure retain no preparation or cache.
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
   * @evidence contracts/development/implementation.md#principled-implementation Positive homogeneous triple determinants and exact endpoint laws provide logarithmic curvature; the unit tangent determines the polar jet.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One primal geometry owner serves the numeric source and fixed-clock derivative descriptor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Curvature is never obtained by subtracting nearly parallel native derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation Endpoint speed is its polygon edge scale; interior speed is log-odds speed; no source curvature derivatives are implied.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four positive triples or one endpoint identity, with fixed storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the final projective probabilities and shared direction without another inverse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed-size numeric descriptor arrays escape.
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
