import type { IAutoMovieVector3 } from "@automovie/interface";

import type { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import type { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { AirborneShapeInertia } from "./AirborneShapeInertia";
import { AirborneShapeReduction } from "./AirborneShapeReduction";
import { AirborneShapeStatistics } from "./AirborneShapeStatistics";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/** The numeric sufficient statistics a query returns. */
type IInstant = integrateAirborneRotation.IInstant;

/** The public query signature. */
type IHistory = integrateAirborneRotation.IHistory;

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
 * steps keeps the step. The shape is read once at each knot. A knot's tensor
 * is that shape's composite inertia about its centre. The relative momentum
 * of the motion between two neighbouring knots is second-order accurate at
 * the middle of their interval (a central difference over the interval), so
 * a knot's relative momentum is the mean of the two mid-interval values
 * either side of it, and at each end of the span the linear extrapolation of
 * the two nearest mid-interval values (the one value, with a single
 * interval): second order in the step for a smooth shape, as the stencil
 * history is in its own millisecond. Between knots the nine scalars (six of
 * the symmetric tensor, three of the momentum) follow the cubic Hermite
 * interpolant through the knots (the cubic matching value and slope at both
 * ends of an interval) with slopes from the knots' own central differences,
 * three-point one-sided at the two ends (the second-order weights of
 * Fornberg 1988, Mathematics of Computation 51:699-706, which the stencil
 * history cites for its boundary): continuous with a continuous first
 * derivative, so an adaptive integrator meets no kink at a knot. A query
 * outside the span holds the nearer end's values.
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
 * @param span The flight's take-off and touchdown, seconds, and the greatest knot spacing, seconds.
 * @param observation Optional native work counter (`integrateAirborneRotation.observe`); omitted, nothing is counted.
 * @returns The history, with `clear` releasing the table and the issued instants; a later query builds the table again.
 * @throws {Error} For a span that is not finite and increasing, a step that is not positive and finite, a released prepared model, or a knot whose tensor has no positive scale.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is tabulated and why it may be, the knots, each knot's two readings with their order, the interpolant and its sources, the lazy build, the statistics' meaning, every input's frame and unit and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The flight's equation reads the shape only through its inertia and relative momentum, functions of time alone, so they are tabulated once for every right-hand side and shooting trial; the mid-interval momentum is the central difference the stencil history uses, at the knot spacing, and the cubic Hermite interpolant with second-order slopes keeps the tabulation's order. The premise is a shape smooth at the scale of the step; the tensor between knots is an interpolant, so its positive definiteness is not certified here and an instant that fails it keeps the principal-axes path, as any issued instant does.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy table build (knot shapes, tensors, mid-interval momenta, knot momenta, slopes), one interpolation, one exact-second memo; the model's reductions are `AirborneShapeReduction`'s and the issued instant `AirborneShapeInertia`'s.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rounded query time, no nearest-knot answer and no changed physical bound: every query interpolates at its own second, and the knots' tensors pass the stencil history's own admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms For K knots and S mass parts the build reads K shapes and does O(K S) reduction once; a query costs nine cubic evaluations and no shape read, where the stencil history reads up to three shapes for each new query second. Runtime gain is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One table serves every stage, defect probe and shooting trial of the history's lifetime, since none of them changes the shape; an exact second's issued instant, with its tensor factor, is shared by the memo. No attitude, momentum or flight answer is kept.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The history owns two arrays of nine scalars a knot and one issued instant per distinct queried second, unbounded in the number of distinct seconds; posed shapes are dropped when the build ends. `clear` releases the arrays, the memo and each instant's factor; the caller releases a prepared model.
 */
export function AirborneTabulatedShapeHistory(
  model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
  shape: (seconds: number) => AirborneShapeReduction.IBones,
  span: { from: number; to: number; step: number },
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
  const instants: Map<number, IInstant> = new Map();
  let table: { values: Float64Array; slopes: Float64Array } | undefined;

  const build = (): { values: Float64Array; slopes: Float64Array } => {
    const values: Float64Array = new Float64Array(WIDTH * (intervals + 1));
    const mids: IAutoMovieVector3[] = [];
    let before: resolveAutoMovieMomentum.IPosed | undefined;
    for (let k: number = 0; k <= intervals; ++k) {
      const posed: resolveAutoMovieMomentum.IPosed = reduction.pose(
        shape(k === intervals ? to : from + k * spacing),
      );
      const matrix: number[][] = reduction.tensor(posed);
      reduction.admit(matrix);
      if (statistics !== undefined) statistics.uniqueNumericNodes++;
      const at: number = WIDTH * k;
      values[at] = matrix[0]![0]!;
      values[at + 1] = matrix[1]![1]!;
      values[at + 2] = matrix[2]![2]!;
      values[at + 3] = (matrix[0]![1]! + matrix[1]![0]!) / 2;
      values[at + 4] = (matrix[0]![2]! + matrix[2]![0]!) / 2;
      values[at + 5] = (matrix[1]![2]! + matrix[2]![1]!) / 2;
      if (before !== undefined)
        mids.push(reduction.between(before, posed, spacing).angular);
      before = posed;
    }

    // A knot's momentum from the mid-interval values either side of it.
    for (let k: number = 0; k <= intervals; ++k) {
      // Inside, the mean of the two neighbours; at an end, the nearest
      // value less half its step toward the next one, or the one value.
      const inside: boolean = k > 0 && k < intervals;
      const near: IAutoMovieVector3 = mids[k === 0 ? 0 : k - 1]!;
      const far: IAutoMovieVector3 = inside
        ? mids[k]!
        : intervals === 1
          ? near
          : mids[k === 0 ? 1 : k - 2]!;
      const weight: number = inside ? 0.5 : -0.5;
      const at: number = WIDTH * k + 6;
      values[at] = near.x + weight * (far.x - near.x);
      values[at + 1] = near.y + weight * (far.y - near.y);
      values[at + 2] = near.z + weight * (far.z - near.z);
    }

    // Slopes per second: central differences, three-point one-sided at the
    // ends, the chord with a single interval.
    const slopes: Float64Array = new Float64Array(values.length);
    for (let k: number = 0; k <= intervals; ++k)
      for (let i: number = 0; i < WIDTH; ++i) {
        const y = (knot: number): number => values[WIDTH * knot + i]!;
        slopes[WIDTH * k + i] =
          intervals === 1
            ? (y(1) - y(0)) / spacing
            : k === 0
              ? (-3 * y(0) + 4 * y(1) - y(2)) / (2 * spacing)
              : k === intervals
                ? (3 * y(k) - 4 * y(k - 1) + y(k - 2)) / (2 * spacing)
                : (y(k + 1) - y(k - 1)) / (2 * spacing);
      }
    return { values, slopes };
  };

  const evaluate = (seconds: number): IInstant => {
    const built: { values: Float64Array; slopes: Float64Array } = (table ??= build());
    const held: number = Math.min(to, Math.max(from, seconds));
    const index: number = Math.min(
      intervals - 1,
      Math.max(0, Math.floor((held - from) / spacing)),
    );
    const s: number = Math.min(1, Math.max(0, (held - (from + index * spacing)) / spacing));

    // The cubic Hermite basis on the unit interval.
    const h00: number = (1 + 2 * s) * (1 - s) * (1 - s);
    const h10: number = s * (1 - s) * (1 - s);
    const h01: number = s * s * (3 - 2 * s);
    const h11: number = s * s * (s - 1);
    const a: number = WIDTH * index;
    const b: number = a + WIDTH;
    const y = (i: number): number =>
      h00 * built.values[a + i]! +
      h10 * spacing * built.slopes[a + i]! +
      h01 * built.values[b + i]! +
      h11 * spacing * built.slopes[b + i]!;
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
