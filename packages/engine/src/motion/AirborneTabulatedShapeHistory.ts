import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import type { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeReduction } from "./AirborneShapeReduction";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";
import { samplePoseVelocity } from "./samplePoseVelocity";
import { tabulateAirborneShapeKnots } from "./tabulateAirborneShapeKnots";

/** The numeric sufficient statistics a query returns. */
type IInstant = IAutoMovieIntegrateAirborneRotation.IInstant;

/** The nonuniform first-derivative weights at one knot. */
type IStencil = readonly (readonly [number, number])[];

/** The public query signature. */
type IHistory = IAutoMovieIntegrateAirborneRotation.IHistory;

/**
 * Scalars tabulated a knot: six of the symmetric tensor, three of the relative
 * momentum.
 */
const WIDTH: number = 9;

/** Maximum knot count within the portable 32-bit packed array length. */
const MAX_KNOTS: number = Math.floor(0xffff_ffff / WIDTH);

/**
 * A shape history tabulated once on uniform knots and interpolated: the
 * composite inertia and the relative angular momentum of a flight's shape,
 * which depend on time alone and not on the flight's unknown momentum or
 * attitude, read from the shape at the knots only.
 *
 * The span first receives uniform knots at approximately the requested maximum
 * step, allowing for floating-point rounding. With at least four uniform
 * intervals and a finite turn bound, intervals whose sampled endpoint frames
 * exceed that bound are subdivided until each adjacent sampled pair meets it.
 * Rotation hidden between accepted samples is outside this bound. The shape is
 * read once per knot. Inertia is computed about each shape's centre of mass.
 * Relative momentum uses orbital and spin rates from the five-point Fornberg
 * derivative on the final grid, with second-order two-pose differences and
 * extrapolation for a short uniform grid.
 *
 * Hermite interpolation uses derivatives from the same grid. If either Bézier
 * control attached to a knot is unsuitable for positive-definite interpolation,
 * the tensor's slope at that knot becomes zero on both sides. This preserves a
 * continuous first derivative. Relative momentum keeps its original slopes.
 * Queries outside the span hold an endpoint.
 *
 * The table is built at the first query, not at construction, so a history that
 * is never read costs nothing and counts nothing. A shape whose own period is
 * the step (a pose track on that grid) loses nothing finer than its knots; a
 * shape with detail between knots is smoothed to them, which is the caller's
 * choice of `step`.
 *
 * The statistics keep the meaning the stencil history gives them: `queries`
 * every call of the reader, `memoHits` the calls answered from the exact-second
 * memo, `uniqueNumericNodes` the shapes actually read and reduced (here the
 * knots, once per table), and the factor and Jacobi counts the issued instants'
 * own work.
 *
 * @param model The body's unchanged mass model for this history's lifetime, or
 *   a prepared token released by its caller after this history is cleared.
 * @param shape The posed bones at a second, in the root's own frame (the root
 *   at the origin, unturned). Pure; read at the knots only, all inside the
 *   span.
 * @param span The flight's take-off and touchdown, seconds, the greatest
 *   uniform knot spacing, seconds, and optionally the sampled shortest-arc turn
 *   limit in radians for grids with at least four uniform intervals (omitted,
 *   no refinement).
 * @param uniformCentre Optional consumer of each uniform knot index and a fresh
 *   copy of its reduced root-frame centre in metres. Refined knots do not
 *   supply playback centres.
 * @param observation Optional native work counter
 *   (`integrateAirborneRotation.observe`); omitted, nothing is counted.
 * @returns The history, with `clear` releasing the table and the issued
 *   instants; a later query builds the table again.
 * @throws {Error} For a span that is not finite and increasing, a step that is
 *   not positive and finite, a turn bound that is not positive, a released
 *   prepared model, or a knot whose tensor has no positive scale, or a grid
 *   that exceeds timestamp precision or table capacity.
 */
export function AirborneTabulatedShapeHistory(
  model:
    | IAutoMovieResolveCenterOfMass.IModel
    | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => AirborneShapeReduction.IBones,
  span: { from: number; to: number; step: number; turn?: number },
  observation?: AirborneShapeStatistics.IObserver,
  uniformCentre?: (index: number, centre: IAutoMovieVector3) => void,
): integrateAirborneRotation.ICachedHistory {
  const { from, to, step }: { from: number; to: number; step: number } = span;
  if (!(to > from))
    throw new Error("A tabulated shape history needs a finite increasing span");
  if (!(step > 0))
    throw new Error("A tabulated shape history needs a positive finite step");
  const statistics: AirborneShapeStatistics.IStatistics | undefined =
    AirborneShapeStatistics.borrow(observation);
  const reduction: AirborneShapeReduction.IReduction =
    AirborneShapeReduction(model);

  // The fewest equal intervals no longer than the step; the subtraction
  // keeps a span that is a whole number of steps, up to the rounding of the
  // division, at that number.
  const intervals: number = Math.max(1, Math.ceil((to - from) / step - 1e-9));
  if (intervals >= MAX_KNOTS)
    throw new Error("A tabulated shape history step needs too many knots");
  const turn: number = span.turn ?? Infinity;
  if (!(turn > 0))
    throw new Error("A tabulated shape history needs a positive turn bound");
  const instants: Map<number, IInstant> = new Map();

  const build = (): ITable => {
    const { times, knots }: ReturnType<typeof tabulateAirborneShapeKnots> =
      tabulateAirborneShapeKnots(
        { from, to, intervals, turn },
        MAX_KNOTS,
        (
          seconds: number,
          uniformIndex?: number,
        ): resolveAutoMovieMomentum.IPosed => {
          if (statistics !== undefined) statistics.uniqueNumericNodes++;
          const posed: resolveAutoMovieMomentum.IPosed = reduction.pose(
            shape(seconds),
          );
          if (uniformCentre !== undefined && uniformIndex !== undefined)
            uniformCentre(uniformIndex, { ...posed.centre });
          return posed;
        },
      );
    const last: number = knots.length - 1;

    const values: Float64Array = new Float64Array(WIDTH * knots.length);
    for (let k: number = 0; k <= last; ++k) {
      const matrix: number[][] = reduction.tensor(knots[k]!);
      reduction.admit(matrix);
      const at: number = WIDTH * k;
      values[at] = matrix[0]![0]!;
      values[at + 1] = matrix[1]![1]!;
      values[at + 2] = matrix[2]![2]!;
      values[at + 3] = (matrix[0]![1]! + matrix[1]![0]!) / 2;
      values[at + 4] = (matrix[0]![2]! + matrix[2]![0]!) / 2;
      values[at + 5] = (matrix[1]![2]! + matrix[2]![1]!) / 2;
    }

    // A knot's relative momentum. With four intervals or more, its point
    // value from the knots about it to fourth order (`pointMomentum`): the
    // interval readings are the chords of each part's path (a part turning
    // through an angle over the step reads its orbital momentum short by
    // the angle squared over six, a thigh tucking at 1/120 s by several
    // percent), and a knot's mean of two of them is second order too.
    // With fewer intervals, the second-order readings of the intervals.
    const mids: IAutoMovieVector3[] = [];
    if (last < 4)
      for (let k: number = 1; k <= last; ++k)
        mids.push(
          reduction.between(knots[k - 1]!, knots[k]!, times[k]! - times[k - 1]!)
            .angular,
        );
    const stencils: IStencil[] =
      last < 4
        ? []
        : times.map((_: number, k: number): IStencil => derivative(times, k));
    for (let k: number = 0; k <= last; ++k) {
      const momentum: IAutoMovieVector3 =
        last < 4
          ? meanMomentum(mids, k, last)
          : pointMomentum(knots, stencils[k]!, k);
      const at: number = WIDTH * k + 6;
      values[at] = momentum.x;
      values[at + 1] = momentum.y;
      values[at + 2] = momentum.z;
    }

    // Slopes per second: with five knots or more, the fourth-order
    // derivative over the five knots about each (`derivative`), so the
    // Hermite interpolant keeps the knots' fourth order; with fewer, the
    // second-order central and three-point one-sided differences of the
    // uniform knots, and the chord with a single interval.
    const slopes: Float64Array = new Float64Array(values.length);
    for (let k: number = 0; k <= last; ++k) {
      const stencil: IStencil | undefined = stencils[k];
      for (let i: number = 0; i < WIDTH; ++i) {
        const y = (knot: number): number => values[WIDTH * knot + i]!;
        if (stencil !== undefined) {
          let sum: number = 0;
          for (const [knot, weight] of stencil) sum += weight * y(knot);
          slopes[WIDTH * k + i] = sum;
          continue;
        }
        const h: number = times[1]! - times[0]!;
        slopes[WIDTH * k + i] =
          last === 1
            ? (y(1) - y(0)) / h
            : k === 0
              ? (-3 * y(0) + 4 * y(1) - y(2)) / (2 * h)
              : k === last
                ? (3 * y(k) - 4 * y(k - 1) + y(k - 2)) / (2 * h)
                : (y(k + 1) - y(k - 1)) / (2 * h);
      }
    }
    // Hermite's interior Bézier controls are the endpoint values displaced
    // by one third of the interval times the signed endpoint derivative.
    for (let k: number = 0; k <= last; ++k) {
      const at: number = WIDTH * k;
      const before: number = k === 0 ? 0 : (times[k - 1]! - times[k]!) / 3;
      const after: number = k === last ? 0 : (times[k + 1]! - times[k]!) / 3;
      const control = (width: number): number[][] =>
        symmetricTensor(
          (i: number): number => values[at + i]! + width * slopes[at + i]!,
        );
      if (
        (k > 0 && physicalInertiaFactor(control(before)) === null) ||
        (k < last && physicalInertiaFactor(control(after)) === null)
      )
        slopes.fill(0, at, at + 6);
    }
    return { values, slopes, times };
  };
  const built: ITable = build();

  const numbers = (
    seconds: number,
  ): { matrix: number[][]; relative: IAutoMovieVector3 } => {
    const held: number = Math.min(to, Math.max(from, seconds));

    let index: number = 0;
    let upper: number = built.times.length - 1;
    while (upper - index > 1) {
      const middle: number = index + Math.floor((upper - index) / 2);
      if (held < built.times[middle]!) upper = middle;
      else index = middle;
    }
    const left: number = built.times[index]!;
    const width: number = built.times[index + 1]! - left;
    const s: number = Math.min(1, Math.max(0, (held - left) / width));

    // The cubic Hermite basis on the unit interval.
    const h00: number = (1 + 2 * s) * (1 - s) * (1 - s);
    const h10: number = s * (1 - s) * (1 - s);
    const h01: number = s * s * (3 - 2 * s);
    const h11: number = s * s * (s - 1);
    const a: number = WIDTH * index;
    const b: number = a + WIDTH;
    const y = (i: number): number =>
      h00 * built.values[a + i]! +
      h10 * width * built.slopes[a + i]! +
      h01 * built.values[b + i]! +
      h11 * width * built.slopes[b + i]!;
    return {
      matrix: symmetricTensor(y),
      relative: { x: y(6), y: y(7), z: y(8) },
    };
  };
  const evaluate = (seconds: number): IInstant => {
    const read: { matrix: number[][]; relative: IAutoMovieVector3 } =
      numbers(seconds);
    return AirborneShapeInertia(read.matrix, read.relative, statistics);
  };
  const query: IHistory = (seconds: number): IInstant => {
    if (statistics !== undefined) statistics.queries++;
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) {
      if (statistics !== undefined) statistics.memoHits++;
      return known;
    }
    // A defect read this second already: its numbers and factorisation make
    // the instant, a memo hit as the instant the defect once made was.
    const held: INumeric | undefined = numerics.get(seconds);
    if (held !== undefined && statistics !== undefined) statistics.memoHits++;
    const instant: IInstant =
      held === undefined
        ? evaluate(seconds)
        : AirborneShapeInertia(
            held.matrix,
            held.relative,
            statistics,
            held.factor,
          );
    if (held !== undefined) numerics.delete(seconds);
    instants.set(seconds, instant);
    return instant;
  };

  // A defect's reading at a second: the issued instant's own, or the same
  // numbers and factorisation without an instant, counted as a query and a
  // factorisation as the instant's would be.
  const numerics: Map<number, INumeric> = new Map();
  const numeric = (seconds: number): INumeric | IInstant => {
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) {
      if (statistics !== undefined) {
        statistics.queries++;
        statistics.memoHits++;
      }
      return known;
    }
    const kept: INumeric | undefined = numerics.get(seconds);
    if (statistics !== undefined) statistics.queries++;
    if (kept !== undefined) {
      if (statistics !== undefined) statistics.memoHits++;
      return kept;
    }
    const read: { matrix: number[][]; relative: IAutoMovieVector3 } =
      numbers(seconds);
    if (statistics !== undefined) statistics.factorizations++;
    const factor: physicalInertiaFactor.IPrepared | null =
      physicalInertiaFactor(read.matrix);
    // A tensor that is not positive definite reads its principal axes, an
    // instant's own path: the instant is issued, holding the failed factor.
    if (factor === null) {
      const instant: IInstant = AirborneShapeInertia(
        read.matrix,
        read.relative,
        statistics,
        null,
      );
      instants.set(seconds, instant);
      return instant;
    }
    const made: INumeric = {
      matrix: read.matrix,
      relative: read.relative,
      factor,
    };
    numerics.set(seconds, made);
    return made;
  };
  return Object.assign(query, {
    native: true as const,
    numericReading: numeric,
    clear: (): void => {
      for (const instant of instants.values())
        AirborneShapeInertia.release(instant);
      instants.clear();
      numerics.clear();
    },
  });
}

/**
 * A defect's numeric reading at a second, with the tensor an instant made from
 * it would own.
 */
interface INumeric extends AirborneTabulatedShapeHistory.IReading {
  /** The interpolated root-frame tensor rows. */
  matrix: number[][];
}

/**
 * A built table: nine scalars and their slopes a knot, the knots' seconds in
 * increasing order.
 */
interface ITable {
  /** Six tensor and three momentum scalars a knot, in knot order. */
  values: Float64Array;

  /** Their slopes per second. */
  slopes: Float64Array;

  /** Each knot's second, increasing. */
  times: readonly number[];
}

/** Reconstruct a symmetric tensor from its packed diagonal and upper triangle. */
function symmetricTensor(y: (i: number) => number): number[][] {
  const xy: number = y(3);
  const xz: number = y(4);
  const yz: number = y(5);
  return [
    [y(0), xy, xz],
    [xy, y(1), yz],
    [xz, yz, y(2)],
  ];
}

/**
 * The fourth-order first-derivative weights at knot `k` over the five knots
 * nearest it (two either side inside, one-sided at the two knots nearest each
 * end), as pairs of a knot index and its weight per second, for knots at any
 * seconds: the weights of Fornberg's recursion for arbitrary grids (Fornberg
 * 1988, Mathematics of Computation 51:699-706), which on uniform knots are the
 * classical five-point ones.
 */
function derivative(
  times: readonly number[],
  k: number,
): readonly (readonly [number, number])[] {
  const last: number = times.length - 1;
  const start: number = Math.min(Math.max(0, k - 2), last - 4);
  const nodes: number[] = [];
  for (let j: number = 0; j < 5; ++j) nodes.push(times[start + j]!);

  // Fornberg's recursion for derivative orders 0 and 1 at `times[k]`.
  const z: number = times[k]!;
  const c: number[][] = nodes.map((): number[] => [0, 0]);
  let c1: number = 1;
  let c4: number = nodes[0]! - z;
  c[0]![0] = 1;
  for (let i: number = 1; i < 5; ++i) {
    const mn: number = Math.min(i, 1);
    let c2: number = 1;
    const c5: number = c4;
    c4 = nodes[i]! - z;
    for (let j: number = 0; j < i; ++j) {
      const c3: number = nodes[i]! - nodes[j]!;
      c2 *= c3;
      if (j === i - 1) {
        for (let m: number = mn; m >= 1; --m)
          c[i]![m] = (c1 * (m * c[i - 1]![m - 1]! - c5 * c[i - 1]![m]!)) / c2;
        c[i]![0] = (-c1 * c5 * c[i - 1]![0]!) / c2;
      }
      for (let m: number = mn; m >= 1; --m)
        c[j]![m] = (c4 * c[j]![m]! - m * c[j]![m - 1]!) / c3;
      c[j]![0] = (c4 * c[j]![0]!) / c3;
    }
    c1 = c2;
  }
  return c.map((row: number[], j: number): readonly [number, number] => [
    start + j,
    row[1]!,
  ]);
}

/**
 * The relative angular momentum about the centre at knot `k`, as a point value
 * of the fourth order in the step: each part's orbital momentum `m (c - C) x
 * c'` with its centre's velocity from the knots' derivative stencil
 * (`derivative`), and its spin `I w` with `w` the stencil applied to the
 * rotation vectors that carry the part's principal frame at the knot to its
 * frame at each neighbouring knot (`samplePoseVelocity.rotationVector` of `q_j
 * q_k^-1`): that vector is a smooth function of time whose derivative at the
 * knot is the angular velocity, so the stencil reads it to the same order. The
 * velocity of the centre drops out, as the parts' offsets from it sum to zero.
 */
function pointMomentum(
  knots: readonly resolveAutoMovieMomentum.IPosed[],
  stencil: IStencil,
  k: number,
): IAutoMovieVector3 {
  const at: resolveAutoMovieMomentum.IPosed = knots[k]!;
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (let i: number = 0; i < at.parts.length; i++) {
    const part: IAutoMovieCombinePhysicalMassProperties.IPart = at.parts[i]!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      part.inertiaRotation,
    );
    let vx: number = 0;
    let vy: number = 0;
    let vz: number = 0;
    let wx: number = 0;
    let wy: number = 0;
    let wz: number = 0;
    for (const [knot, weight] of stencil) {
      const other: IAutoMovieCombinePhysicalMassProperties.IPart =
        knots[knot]!.parts[i]!;
      vx += weight * other.centerOfMass.x;
      vy += weight * other.centerOfMass.y;
      vz += weight * other.centerOfMass.z;
      if (knot === k) continue;
      const turn: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
        Quaternion.multiply(other.inertiaRotation, inverse),
      );
      wx += weight * turn.x;
      wy += weight * turn.y;
      wz += weight * turn.z;
    }
    const rx: number = part.centerOfMass.x - at.centre.x;
    const ry: number = part.centerOfMass.y - at.centre.y;
    const rz: number = part.centerOfMass.z - at.centre.z;
    const spin: IAutoMovieVector3 = physicalInertiaTensor.spin(
      part,
      part.inertiaRotation,
      {
        x: wx,
        y: wy,
        z: wz,
      },
    );
    x += (ry * vz - rz * vy) * part.mass + spin.x;
    y += (rz * vx - rx * vz) * part.mass + spin.y;
    z += (rx * vy - ry * vx) * part.mass + spin.z;
  }
  return { x, y, z };
}

/**
 * A knot's relative momentum from the interval readings (`mids[c]` runs from
 * knot `c` to knot `c + 1`), second order, for fewer than four intervals: the
 * mean of the two either side inside, the linear extrapolation of the two
 * nearest at an end, or the one reading.
 */
function meanMomentum(
  mids: readonly IAutoMovieVector3[],
  k: number,
  intervals: number,
): IAutoMovieVector3 {
  const inside: boolean = k > 0 && k < intervals;
  const near: IAutoMovieVector3 = mids[k === 0 ? 0 : k - 1]!;
  const far: IAutoMovieVector3 = inside
    ? mids[k]!
    : intervals === 1
      ? near
      : mids[k === 0 ? 1 : k - 2]!;
  const weight: number = inside ? 0.5 : -0.5;
  return {
    x: near.x + weight * (far.x - near.x),
    y: near.y + weight * (far.y - near.y),
    z: near.z + weight * (far.z - near.z),
  };
}

/** Provenance of the tabulated reader. */
export namespace AirborneTabulatedShapeHistory {
  /**
   * Whether a reader was issued by this producer: a pure function of time whose
   * instants may be shared between an operation's stages. It proves
   * construction, not a constant shape.
   */
  export function owned(history: IHistory & IReadable): boolean {
    return history.native === true;
  }

  /** An issued history, carrying its numeric reader. */
  export interface IReadable {
    /** Set by the factory. */
    readonly native?: true;

    /** The history's numeric reader; absent on any other reader. */
    readonly numericReading?: (seconds: number) => IReading | IInstant;
  }

  /**
   * A second's relative momentum and positive-definite tensor factorisation,
   * read without issuing an instant.
   */
  export interface IReading {
    /** The relative angular momentum in the root frame, kg m²/s. */
    relative: IAutoMovieVector3;

    /** The tensor's factorisation. */
    factor: physicalInertiaFactor.IPrepared;
  }

  /**
   * The issued reader's numeric reading of a second, for a defect that needs
   * only the tensor's factorisation and the relative momentum: the issued
   * instant where the second already has one, otherwise the same numbers and
   * factorisation without an instant, or a newly issued instant where the
   * tensor is not positive definite. Counted as the query and factorisation an
   * instant would make. Undefined for a reader this producer did not issue.
   */
  export function reading(
    history: IHistory & IReadable,
  ): ((seconds: number) => IReading | IInstant) | undefined {
    return history.numericReading;
  }
}
