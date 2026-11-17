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
import { Vector3 } from "../math/Vector3";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeReduction } from "./AirborneShapeReduction";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";
import { samplePoseVelocity } from "./samplePoseVelocity";

/** The numeric sufficient statistics a query returns. */
type IInstant = IAutoMovieIntegrateAirborneRotation.IInstant;

/** The public query signature. */
type IHistory = IAutoMovieIntegrateAirborneRotation.IHistory;

/** Scalars tabulated a knot: six of the symmetric tensor, three of the relative momentum. */
const WIDTH: number = 9;

/** Only readers issued by this producer are recognised as native. */
const HISTORIES: WeakSet<IHistory> = new WeakSet();

/**
 * A shape history tabulated once on uniform knots and interpolated: the
 * composite inertia and the relative angular momentum of a flight's shape,
 * which depend on time alone and not on the flight's unknown momentum or
 * attitude, read from the shape at the knots only.
 *
 * The span is divided into the fewest equal intervals no longer than `step`,
 * so the knots lie inside the span and a span that is a whole number of
 * steps keeps the step. With four intervals or more and a `turn` bound, an
 * interval across which some mass part's principal frame turns by more than
 * `turn` radians is divided into the fewest equal parts that bring every
 * part's turn within it, so a shape that moves fast for a moment (a tuck laid
 * in over 50 ms) is read finely there and nowhere else. The shape is read
 * once at each knot. A knot's tensor
 * is that shape's composite inertia about its centre. With four intervals or
 * more, a knot's relative momentum is its point value to fourth order in the
 * knot spacing: each part's centre velocity and spin rate from the five-point
 * derivative over the knots about it, Fornberg's weights for knots at any
 * seconds (`derivative`, `pointMomentum`). With fewer,
 * the momentum of the motion between two neighbouring knots (a central
 * difference over the interval) is read at the interval's middle, and a
 * knot's is the mean of the two either side and the linear extrapolation
 * at an end, second order. Between knots the
 * nine scalars (six of the symmetric tensor, three of the momentum) follow
 * the cubic Hermite interpolant through the knots (the cubic matching value
 * and slope at both ends of an interval) with slopes from the knots' own
 * fourth-order differences, central inside and one-sided at the two knots
 * nearest each end (the weights of Fornberg 1988, Mathematics of
 * Computation 51:699-706, which the stencil history cites for its boundary;
 * second order with fewer than four intervals): continuous with a
 * continuous first derivative, so an adaptive integrator meets no kink at a
 * knot. A tuck laid in over 50 ms spans six knots at 1/120 s, and the
 * second-order interval readings left its relative momentum several percent
 * off during the fade (a part's chord across a turn of the angle `a` reads
 * its orbital momentum short by `a^2 / 6`), which the flight's displayed
 * momentum showed as a 7 % change. A query outside the span holds the
 * nearer end's values.
 *
 * The table is built at the first query, not at construction, so a history
 * that is never read costs nothing and counts nothing. A shape whose own
 * period is the step (a pose track on that grid) loses nothing finer than
 * its knots; a shape with detail between knots is smoothed to them, which is
 * the caller's choice of `step`.
 *
 * The statistics keep the meaning the stencil history gives them: `queries`
 * every call of the reader, `memoHits` the calls answered from the
 * exact-second memo, `uniqueNumericNodes` the shapes actually read and
 * reduced (here the knots, once per table), and the factor and Jacobi counts
 * the issued instants' own work.
 *
 * @param model The body's unchanged mass model for this history's lifetime, or a prepared token released by its caller after this history is cleared.
 * @param shape The posed bones at a second, in the root's own frame (the root at the origin, unturned). Pure; read at the knots only, all inside the span.
 * @param span The flight's take-off and touchdown, seconds, the greatest uniform knot spacing, seconds, and optionally the most any mass part may turn between neighbouring knots, radians (omitted, no interval is divided).
 * @param observation Optional native work counter (`integrateAirborneRotation.observe`); omitted, nothing is counted.
 * @returns The history, with `clear` releasing the table and the issued instants; a later query builds the table again.
 * @throws {Error} For a span that is not finite and increasing, a step that is not positive and finite, a turn bound that is not positive, a released prepared model, or a knot whose tensor has no positive scale.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is tabulated and why it may be, the knots, each knot's two readings with their order, the interpolant and its sources, the lazy build, the statistics' meaning, every input's frame and unit and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The flight's equation reads the shape only through its inertia and relative momentum, functions of time alone, so they are tabulated once for every right-hand side and shooting trial; a knot's relative momentum is the orbital-plus-spin sum the stencil history's two-pose reading forms, with each part's centre velocity and spin rate from Fornberg's five-point derivative over the knots (the rotation vectors of the part's frame relative to its knot frame have the angular velocity as their derivative there), and the cubic Hermite interpolant with fourth-order slopes keeps that order; fewer than four intervals keep the second-order interval readings. The premise is a shape smooth at the scale of the step; the tensor between knots is an interpolant, so its positive definiteness is not certified here and an instant that fails it keeps the principal-axes path, as any issued instant does.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy table build (uniform knot shapes, the divided intervals' shapes, tensors, knot momenta, slopes), one interpolation that finds its interval and part in constant time, one exact-second memo; the model's reductions are `AirborneShapeReduction`'s, the issued instant `AirborneShapeInertia`'s and the derivative weights Fornberg's recursion's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rounded query time, no nearest-knot answer and no changed physical bound: every query interpolates at its own second, and the knots' tensors pass the stencil history's own admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms For K uniform knots, D added knots where parts turn fast and S mass parts the build reads K + D shapes and does O((K + D) S) reduction once, five-point stencils included; a query costs nine cubic evaluations and no shape read, where the stencil history reads up to three shapes for each new query second. Knots are added only in intervals where a part turns past the bound, and a shape that turns within it everywhere keeps one read a uniform knot. Runtime gain is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One table serves every stage, defect probe and shooting trial of the history's lifetime, since none of them changes the shape; an exact second's issued instant, with its tensor factor, is shared by the memo. No attitude, momentum or flight answer is kept.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The history owns two arrays of nine scalars a knot, the knots' seconds, two integers a uniform interval and one issued instant per distinct queried second, unbounded in the number of distinct seconds; posed shapes are dropped when the build ends. `clear` releases the arrays, the memo and each instant's factor; the caller releases a prepared model.
 */
export function AirborneTabulatedShapeHistory(
  model: IAutoMovieResolveCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => AirborneShapeReduction.IBones,
  span: { from: number; to: number; step: number; turn?: number },
  observation?: AirborneShapeStatistics.IObserver,
): integrateAirborneRotation.ICachedHistory {
  const { from, to, step }: { from: number; to: number; step: number } = span;
  if (!Number.isFinite(from) || !Number.isFinite(to) || !(to > from))
    throw new Error("A tabulated shape history needs a finite increasing span");
  if (!Number.isFinite(step) || !(step > 0))
    throw new Error("A tabulated shape history needs a positive finite step");
  const statistics: AirborneShapeStatistics.IStatistics | undefined =
    AirborneShapeStatistics.borrow(observation);
  const reduction: AirborneShapeReduction.IReduction = AirborneShapeReduction(model);

  // The fewest equal intervals no longer than the step; the subtraction
  // keeps a span that is a whole number of steps, up to the rounding of the
  // division, at that number.
  const intervals: number = Math.max(1, Math.ceil((to - from) / step - 1e-9));
  const spacing: number = (to - from) / intervals;
  const turn: number = span.turn ?? Infinity;
  if (!(turn > 0))
    throw new Error("A tabulated shape history needs a positive turn bound");
  const instants: Map<number, IInstant> = new Map();
  let table: ITable | undefined;

  const build = (): ITable => {
    // The uniform knots, then each interval across which some part turns
    // more than the bound divided into the fewest equal parts that keep
    // every part's turn within it (one more shape read a part). A part's
    // turn between two knots is the angle of its principal frame's change.
    const read = (seconds: number): resolveAutoMovieMomentum.IPosed => {
      if (statistics !== undefined) statistics.uniqueNumericNodes++;
      return reduction.pose(shape(seconds));
    };
    const coarse: resolveAutoMovieMomentum.IPosed[] = [];
    for (let k: number = 0; k <= intervals; ++k)
      coarse.push(read(k === intervals ? to : from + k * spacing));
    const parts: Int32Array = new Int32Array(intervals);
    const first: Int32Array = new Int32Array(intervals + 1);
    const times: number[] = [];
    const knots: resolveAutoMovieMomentum.IPosed[] = [];
    for (let k: number = 0; k < intervals; ++k) {
      const a: resolveAutoMovieMomentum.IPosed = coarse[k]!;
      const b: resolveAutoMovieMomentum.IPosed = coarse[k + 1]!;
      // A span of fewer than four intervals keeps its uniform second-order
      // table (a flight under 4 steps), so its knots stay equally spaced.
      let largest: number = 0;
      if (Number.isFinite(turn) && intervals >= 4)
        for (let i: number = 0; i < a.parts.length; i++)
          largest = Math.max(largest, Vector3.length(samplePoseVelocity.rotationVector(
            Quaternion.multiply(b.parts[i]!.inertiaRotation, Quaternion.inverse(a.parts[i]!.inertiaRotation)),
          )));
      // A shortest-arc turn is at most a half turn, so an interval is divided
      // into at most ceil(pi / turn) parts; a turn that is not a number (a
      // shape that is not finite, which the tensor's admission then refuses)
      // divides nothing.
      const count: number = Number.isFinite(largest)
        ? Math.max(1, Math.ceil(Math.min(largest, Math.PI) / turn))
        : 1;
      parts[k] = count;
      first[k] = knots.length;
      const start: number = from + k * spacing;
      times.push(start);
      knots.push(a);
      for (let j: number = 1; j < count; ++j) {
        times.push(start + (j * spacing) / count);
        knots.push(read(start + (j * spacing) / count));
      }
    }
    first[intervals] = knots.length;
    times.push(to);
    knots.push(coarse[intervals]!);
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
        mids.push(reduction.between(knots[k - 1]!, knots[k]!, times[k]! - times[k - 1]!).angular);
    for (let k: number = 0; k <= last; ++k) {
      const momentum: IAutoMovieVector3 = last < 4
        ? meanMomentum(mids, k, last)
        : pointMomentum(knots, times, k);
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
      const stencil: readonly (readonly [number, number])[] | null =
        last < 4 ? null : derivative(times, k);
      for (let i: number = 0; i < WIDTH; ++i) {
        const y = (knot: number): number => values[WIDTH * knot + i]!;
        if (stencil !== null) {
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
    return { values, slopes, times, parts, first };
  };

  const evaluate = (seconds: number): IInstant => {
    const built: ITable = (table ??= build());
    const held: number = Math.min(to, Math.max(from, seconds));

    // The uniform interval, then its equal part: constant work.
    const coarse: number = Math.min(
      intervals - 1,
      Math.max(0, Math.floor((held - from) / spacing)),
    );
    const count: number = built.parts[coarse]!;
    const index: number = built.first[coarse]! + Math.min(
      count - 1,
      Math.max(0, Math.floor(((held - (from + coarse * spacing)) / spacing) * count)),
    );
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
    return AirborneShapeInertia(
      [
        [y(0), y(3), y(4)],
        [y(3), y(1), y(5)],
        [y(4), y(5), y(2)],
      ],
      { x: y(6), y: y(7), z: y(8) },
      statistics,
    );
  };
  const query: IHistory = (seconds: number): IInstant => {
    if (statistics !== undefined) statistics.queries++;
    const known: IInstant | undefined = instants.get(seconds);
    if (known !== undefined) {
      if (statistics !== undefined) statistics.memoHits++;
      return known;
    }
    const instant: IInstant = evaluate(seconds);
    instants.set(seconds, instant);
    return instant;
  };
  HISTORIES.add(query);
  return Object.assign(query, {
    clear: (): void => {
      for (const instant of instants.values()) AirborneShapeInertia.release(instant);
      instants.clear();
      table = undefined;
    },
  });
}

/** A built table: nine scalars and their slopes a knot, the knots' seconds and how each uniform interval is divided. */
interface ITable {
  /** Six tensor and three momentum scalars a knot, in knot order. */
  values: Float64Array;

  /** Their slopes per second. */
  slopes: Float64Array;

  /** Each knot's second, increasing. */
  times: readonly number[];

  /** The equal parts each uniform interval is divided into. */
  parts: Int32Array;

  /** The index of each uniform interval's first knot, and the last knot's after them. */
  first: Int32Array;
}

/**
 * The fourth-order first-derivative weights at knot `k` over the five knots
 * nearest it (two either side inside, one-sided at the two knots nearest
 * each end), as pairs of a knot index and its weight per second, for knots
 * at any seconds: the weights of Fornberg's recursion for arbitrary grids
 * (Fornberg 1988, Mathematics of Computation 51:699-706), which on uniform
 * knots are the classical five-point ones.
 */
function derivative(times: readonly number[], k: number): readonly (readonly [number, number])[] {
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
  return c.map((row: number[], j: number): readonly [number, number] => [start + j, row[1]!]);
}

/**
 * The relative angular momentum about the centre at knot `k`, as a point
 * value of the fourth order in the step: each part's orbital momentum
 * `m (c - C) x c'` with its centre's velocity from the knots' derivative
 * stencil (`derivative`), and its spin `I w` with `w` the stencil applied to
 * the rotation vectors that carry the part's principal frame at the knot to
 * its frame at each neighbouring knot (`samplePoseVelocity.rotationVector`
 * of `q_j q_k^-1`): that vector is a smooth function of time whose
 * derivative at the knot is the angular velocity, so the stencil reads it to
 * the same order. The velocity of the centre drops out, as the parts'
 * offsets from it sum to zero.
 */
function pointMomentum(
  knots: readonly resolveAutoMovieMomentum.IPosed[],
  times: readonly number[],
  k: number,
): IAutoMovieVector3 {
  const stencil: readonly (readonly [number, number])[] = derivative(times, k);
  const at: resolveAutoMovieMomentum.IPosed = knots[k]!;
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (let i: number = 0; i < at.parts.length; i++) {
    const part: IAutoMovieCombinePhysicalMassProperties.IPart = at.parts[i]!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(part.inertiaRotation);
    let vx: number = 0;
    let vy: number = 0;
    let vz: number = 0;
    let wx: number = 0;
    let wy: number = 0;
    let wz: number = 0;
    for (const [knot, weight] of stencil) {
      const other: IAutoMovieCombinePhysicalMassProperties.IPart = knots[knot]!.parts[i]!;
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
    const spin: IAutoMovieVector3 = physicalInertiaTensor.spin(part, part.inertiaRotation, {
      x: wx,
      y: wy,
      z: wz,
    });
    x += (ry * vz - rz * vy) * part.mass + spin.x;
    y += (rz * vx - rx * vz) * part.mass + spin.y;
    z += (rx * vy - ry * vx) * part.mass + spin.z;
  }
  return { x, y, z };
}

/**
 * A knot's relative momentum from the interval readings (`mids[c]` runs
 * from knot `c` to knot `c + 1`), second order, for fewer than four
 * intervals: the mean of the two either side inside, the linear
 * extrapolation of the two nearest at an end, or the one reading.
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

/**
 * Provenance of the tabulated reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation `owned` states what it recognises and what that does not prove.
 * @evidence contracts/development/design.md#principled-representation A private weak set of issued readers; membership is construction, nothing more.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One predicate, read by `AirborneShapeHistory.owned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller flag or wrapper can join the set.
 */
export namespace AirborneTabulatedShapeHistory {
  /** Whether a reader was issued by this producer: a pure function of time whose instants may be shared between an operation's stages. It proves construction, not a constant shape. */
  export function owned(history: IHistory): boolean {
    return HISTORIES.has(history);
  }
}
